import { useMemo, useState } from "react";

import { filterCamps, ALL_REGIONS } from "@/utils/filterCamps";

/**
 * Own the search/region filter state and apply it to the schedule's lists.
 *
 * Extracted from App for two reasons: it keeps the component under the
 * complexity cap, and it makes the filter logic testable on its own. Each list
 * is filtered through the same memoized `filters`, so the three views can never
 * disagree about what a query means.
 *
 * @param {Array} camps    Whole timeline (for the calendar).
 * @param {Array} upcoming Upcoming side (for the list/map upcoming tab).
 * @param {Array} past     Past side (for the list/map past tab).
 * @returns {{
 *   query: string, setQuery: Function,
 *   region: string, setRegion: Function,
 *   isFiltering: boolean,
 *   shownCamps: Array, shownUpcoming: Array, shownPast: Array,
 * }}
 */
export function useCampFilters(camps, upcoming, past) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState(ALL_REGIONS);

  const filters = useMemo(() => ({ query, region }), [query, region]);

  const shownCamps = useMemo(() => filterCamps(camps, filters), [camps, filters]);
  const shownUpcoming = useMemo(
    () => filterCamps(upcoming, filters),
    [upcoming, filters],
  );
  const shownPast = useMemo(() => filterCamps(past, filters), [past, filters]);

  const isFiltering = query.trim() !== "" || region !== ALL_REGIONS;

  return {
    query,
    setQuery,
    region,
    setRegion,
    isFiltering,
    shownCamps,
    shownUpcoming,
    shownPast,
  };
}
