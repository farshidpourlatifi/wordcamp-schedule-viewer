import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchWordCamps, SCHEDULED_STATUS } from "@/api/wordcamps";
import { normalizeWordCamps } from "@/utils/normalizeWordCamp";
import { partitionByDate } from "@/utils/partitionByDate";

/**
 * Load WordCamps and hand the UI ready-to-render lists.
 *
 * The hook owns the whole data path — fetch, normalize, partition — so
 * components receive view models and never touch an API field name. Both
 * `fetchImpl` and `now` are injectable, which is what lets the tests run the
 * full path with no network and a frozen clock.
 *
 * Two queries, not one. The scheduled feed (`?status=wcpt-scheduled`) is ~40
 * records in a single request and drives the first paint; the full archive is
 * ~1,500 records across 15 requests and streams in behind it. Until the archive
 * lands the app already shows upcoming events instead of a blank spinner, and
 * `isArchiveLoading` lets past-heavy views say the rest is still coming.
 */

/** Cache key root; each query namespaces under it. */
export const WORDCAMPS_QUERY_KEY = ["wordcamps"];

/** Stable empty list, so the loading and error states return one identity. */
const EMPTY = [];

/**
 * @param {Object} [options]
 * @param {Function} [options.fetchImpl] Injectable fetch, for tests.
 * @param {Date} [options.now] Injectable clock. Omit in app code — passing an
 *   inline `new Date()` would change identity every render and re-partition
 *   the whole list each time.
 * @returns {{camps: Array, upcoming: Array, past: Array, isLoading: boolean,
 *   isArchiveLoading: boolean, isError: boolean, error: Error|null,
 *   refetch: Function}} `camps` is the whole list; `upcoming`/`past` are it
 *   split around `now`.
 */
export function useWordCamps({ fetchImpl, now } = {}) {
  const scheduled = useQuery({
    queryKey: [...WORDCAMPS_QUERY_KEY, "scheduled"],
    // TanStack Query supplies an AbortSignal; forwarding it means an unmount
    // cancels the in-flight request instead of finishing it.
    queryFn: ({ signal }) =>
      fetchWordCamps({ fetchImpl, signal, status: SCHEDULED_STATUS }),
  });

  const archive = useQuery({
    queryKey: [...WORDCAMPS_QUERY_KEY, "all"],
    queryFn: ({ signal }) => fetchWordCamps({ fetchImpl, signal }),
  });

  // Prefer the complete archive once it arrives; show the fast scheduled feed
  // in the meantime so the first paint is not gated on 15 requests.
  const data = archive.data ?? scheduled.data;

  // Normalizing and partitioning ~1,500 records is not free, and it does not
  // depend on anything that changes between renders. Memoizing also keeps the
  // returned array identities stable, so the calendar view can memoize too.
  const { camps, upcoming, past } = useMemo(() => {
    if (!data) return { camps: EMPTY, upcoming: EMPTY, past: EMPTY };

    // The calendar wants one continuous timeline, the list wants the split —
    // both come off a single normalize pass rather than doing it twice.
    const normalized = normalizeWordCamps(data);

    return { camps: normalized, ...partitionByDate(normalized, now) };
  }, [data, now]);

  return {
    camps,
    upcoming,
    past,
    // First paint is gated on the fast query only.
    isLoading: scheduled.isPending,
    // The archive is still streaming; past-heavy views can note it.
    isArchiveLoading: archive.isPending,
    isError: scheduled.isError,
    error: scheduled.error,
    refetch: () => {
      scheduled.refetch();
      archive.refetch();
    },
  };
}
