import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchWordCamps } from "@/api/wordcamps";
import { normalizeWordCamps } from "@/utils/normalizeWordCamp";
import { partitionByDate } from "@/utils/partitionByDate";

/**
 * Load WordCamps and hand the UI two ready-to-render lists.
 *
 * The hook owns the whole data path — fetch, normalize, partition — so
 * components receive view models and never touch an API field name. Both
 * `fetchImpl` and `now` are injectable, which is what lets the tests run the
 * full path with no network and a frozen clock.
 */

/** Cache key for the camps collection. */
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
 *   isError: boolean, error: Error|null, refetch: Function}} `camps` is the
 *   whole list; `upcoming`/`past` are it split around `now`.
 */
export function useWordCamps({ fetchImpl, now } = {}) {
  const query = useQuery({
    queryKey: WORDCAMPS_QUERY_KEY,
    // TanStack Query supplies an AbortSignal; forwarding it means an unmount
    // cancels the remaining page requests instead of finishing all 15.
    queryFn: ({ signal }) => fetchWordCamps({ fetchImpl, signal }),
  });

  const { data } = query;

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
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
