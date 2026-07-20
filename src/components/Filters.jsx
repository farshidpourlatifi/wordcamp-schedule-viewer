import { Search } from "lucide-react";

import { cn } from "@/lib/cn";
import { ALL_REGIONS } from "@/utils/filterCamps";
import { CONTINENTS } from "@/utils/continent";

/**
 * Search and region controls for the schedule.
 *
 * Native `<input>` and `<select>` on purpose: they bring keyboard support, the
 * mobile keyboard/picker, and form semantics for free, which a custom widget
 * would have to rebuild and keep in sync. The filtering itself is done by the
 * pure `filterCamps`; this component only collects the inputs and reports the
 * count.
 *
 * @param {Object} props
 * @param {string} props.query
 * @param {(value: string) => void} props.onQueryChange
 * @param {string} props.region
 * @param {(value: string) => void} props.onRegionChange
 * @param {number} props.resultCount Matches after filtering.
 * @param {number} props.totalCount Matches before filtering.
 */
export function Filters({
  query,
  onQueryChange,
  region,
  onRegionChange,
  resultCount,
  totalCount,
}) {
  const isFiltering = query.trim() !== "" || region !== ALL_REGIONS;

  const fieldClasses =
    "rounded-md border border-input bg-background text-sm text-foreground";

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <div className="relative min-w-48 flex-1">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <label htmlFor="camp-search" className="sr-only">
          Search WordCamps
        </label>
        <input
          id="camp-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search city, country, venue…"
          className={cn(fieldClasses, "w-full py-2 pl-9 pr-3")}
        />
      </div>

      <div>
        <label htmlFor="camp-region" className="sr-only">
          Filter by region
        </label>
        <select
          id="camp-region"
          value={region}
          onChange={(event) => onRegionChange(event.target.value)}
          className={cn(fieldClasses, "px-3 py-2")}
        >
          <option value={ALL_REGIONS}>All regions</option>
          {CONTINENTS.map((continent) => (
            <option key={continent} value={continent}>
              {continent}
            </option>
          ))}
        </select>
      </div>

      {/* Announced on change so a screen-reader user hears the filter's effect
          instead of it happening silently. */}
      <p
        aria-live="polite"
        className="ml-auto text-sm text-muted-foreground"
      >
        {isFiltering
          ? `${resultCount} of ${totalCount} events`
          : `${totalCount} events`}
      </p>
    </div>
  );
}
