import { useMemo, useState } from "react";

import { WordCampCard } from "@/components/WordCampCard";
import { Button } from "@/components/ui/button";
import { groupByMonth } from "@/utils/groupByMonth";

/**
 * The list view: WordCamps grouped into month sections.
 *
 * Companion to `MonthCalendar`, which is the assignment's required primary
 * view. This list exists because the calendar cannot serve the Past tab: a
 * month-at-a-time grid means ~219 clicks to page through history. The list
 * scans that history in one scroll, so the two views split the work by
 * density rather than duplicating each other.
 *
 * Long lists reveal progressively. The Past list runs to ~1,443 camps across
 * ~219 month sections against live data — rendering that in one pass costs
 * seconds of layout and is unusable to scroll. Showing a recent window with a
 * "Show earlier" control keeps the first paint cheap without pulling in a
 * virtualization dependency, and keeps every rendered camp in the DOM for
 * find-in-page and assistive tech.
 */

/** Month sections rendered before the reveal control appears. */
export const INITIAL_MONTHS = 12;

/**
 * @param {Object} props
 * @param {Array} props.camps Normalized camps, already in display order.
 * @param {string} props.emptyMessage Shown when there are no camps at all.
 * @param {string} [props.revealLabel] Label for the reveal button.
 */
export function ListView({ camps, emptyMessage, revealLabel }) {
  const groups = useMemo(() => groupByMonth(camps), [camps]);
  const [visibleMonths, setVisibleMonths] = useState(INITIAL_MONTHS);

  if (groups.length === 0) {
    return <p className="py-12 text-muted-foreground">{emptyMessage}</p>;
  }

  const visibleGroups = groups.slice(0, visibleMonths);
  const hiddenCount = groups.length - visibleGroups.length;

  return (
    <div>
      {visibleGroups.map((group) => (
        <section key={group.key} className="mb-8">
          {/* h2: the page h1 is the app title, and card titles are h3, so
              month labels sit between them with no level skipped. */}
          <h2 className="mb-3 border-b border-border pb-2 text-sm font-bold uppercase tracking-wider text-primary">
            {group.label}
          </h2>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {group.camps.map((camp) => (
              <WordCampCard key={camp.id} camp={camp} />
            ))}
          </div>
        </section>
      ))}

      {hiddenCount > 0 && (
        <Button
          onClick={() => setVisibleMonths((months) => months + INITIAL_MONTHS)}
          className="w-full"
        >
          {/* The count goes in the label so the control says what it will do,
              rather than making the user click to find out. */}
          {revealLabel ?? "Show earlier"} ({hiddenCount} more months)
        </Button>
      )}
    </div>
  );
}
