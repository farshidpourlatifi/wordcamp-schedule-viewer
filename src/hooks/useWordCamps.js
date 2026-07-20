import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  fetchWordCamps,
  fetchWordCampCount,
  SCHEDULED_STATUS,
  CLOSED_STATUS,
} from "@/api/wordcamps";
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
 * Loading is lazy, not eager. The scheduled feed (`?status=wcpt-scheduled`) is
 * ~40 records in one request and loads immediately — enough for the default
 * list's Upcoming tab. The past archive (`?status=wcpt-closed`) is ~1,441
 * records across ~15 requests (~4 MB) and loads only when something actually
 * needs it: the Past tab, the calendar, the map's past side, or a search.
 * `requestArchive` triggers it. The grand total comes from the `X-WP-Total`
 * header via a one-record count request, so the UI can show "1,481 events"
 * before the archive is anywhere near loaded.
 *
 * The API offers no other lever: the event date and venue location are meta
 * fields it will not filter or sort by, so a slice can't be fetched per view —
 * status is the only axis, and it splits the feed exactly into these two.
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
 * @returns {{camps: Array, upcoming: Array, past: Array, totalCount: number,
 *   isLoading: boolean, isArchiveLoading: boolean, isArchiveLoaded: boolean,
 *   requestArchive: Function, isError: boolean, error: Error|null,
 *   refetch: Function}}
 */
export function useWordCamps({ fetchImpl, now } = {}) {
  // The past archive is loaded on demand; this flips once and stays on.
  const [archiveRequested, setArchiveRequested] = useState(false);
  const requestArchive = useCallback(() => setArchiveRequested(true), []);

  const count = useQuery({
    queryKey: [...WORDCAMPS_QUERY_KEY, "count"],
    queryFn: ({ signal }) => fetchWordCampCount({ fetchImpl, signal }),
  });

  const scheduled = useQuery({
    queryKey: [...WORDCAMPS_QUERY_KEY, "scheduled"],
    // TanStack Query supplies an AbortSignal; forwarding it means an unmount
    // cancels the in-flight request instead of finishing it.
    queryFn: ({ signal }) =>
      fetchWordCamps({ fetchImpl, signal, status: SCHEDULED_STATUS }),
  });

  const archive = useQuery({
    queryKey: [...WORDCAMPS_QUERY_KEY, "closed"],
    queryFn: ({ signal }) =>
      fetchWordCamps({ fetchImpl, signal, status: CLOSED_STATUS }),
    enabled: archiveRequested,
  });

  // Combine whatever has loaded. Scheduled is always present after first paint;
  // the closed archive joins it once requested and resolved. Partitioning the
  // combined set by date keeps the upcoming/past split date-accurate rather
  // than trusting the status labels at the boundary.
  const scheduledData = scheduled.data;
  const archiveData = archive.data;
  const { camps, upcoming, past } = useMemo(() => {
    if (!scheduledData) return { camps: EMPTY, upcoming: EMPTY, past: EMPTY };

    const normalized = normalizeWordCamps([
      ...scheduledData,
      ...(archiveData ?? []),
    ]);

    return { camps: normalized, ...partitionByDate(normalized, now) };
  }, [scheduledData, archiveData, now]);

  return {
    camps,
    upcoming,
    past,
    // Header count when available, else what has actually loaded.
    totalCount: count.data ?? camps.length,
    // First paint is gated on the fast scheduled feed only.
    isLoading: scheduled.isPending,
    // The archive was requested and is still in flight.
    isArchiveLoading: archiveRequested && archive.isPending,
    isArchiveLoaded: archive.isSuccess,
    requestArchive,
    isError: scheduled.isError,
    error: scheduled.error,
    refetch: () => {
      count.refetch();
      scheduled.refetch();
      if (archiveRequested) archive.refetch();
    },
  };
}
