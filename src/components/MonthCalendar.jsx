import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  WEEKDAYS,
  addUtcMonths,
  buildMonthGrid,
  indexCampsByDay,
  isLongRunning,
  monthBounds,
  startOfUtcMonth,
  toDayKey,
} from "@/utils/calendarGrid";
import { formatCampDate, formatMonthLabel } from "@/utils/formatDate";

/**
 * The calendar view: one month at a time, as a real grid.
 *
 * This is the assignment's required primary view. It renders a native
 * `<table>` rather than an ARIA `role="grid"`: this is a read-only display of
 * events, not a date picker, so the grid pattern's roving tabindex and
 * arrow-key navigation would be machinery with no user benefit. A table gives
 * screen readers row and column relationships for free, and the camp links
 * inside cells stay in the natural tab order.
 *
 * `ListView` is the companion for bulk browsing — a month-at-a-time grid
 * cannot serve ~219 months of past camps.
 */

/**
 * First month to display.
 *
 * The first camp's month, not today's. `partitionByDate` sorts upcoming
 * soonest-first and past most-recent-first, so the first camp is always the
 * one nearest to now on that tab — which means the calendar never opens on an
 * empty grid. For the Past tab "today" is out of range by definition, so
 * anchoring on the clock would be actively wrong there.
 *
 * @param {Array<{startDate: Date|null}>} camps
 * @param {Date} now Fallback when no camp has a usable date.
 * @returns {Date} First of the month to render.
 */
function initialMonth(camps, now) {
  const dated = camps.find((camp) => camp?.startDate);

  return startOfUtcMonth(dated ? dated.startDate : now);
}

/**
 * @param {Object} props
 * @param {Array} props.camps Normalized camps, already in display order.
 * @param {string} props.emptyMessage Shown when there are no camps at all.
 * @param {Date} [props.now] Injectable clock, so "today" is testable.
 */
export function MonthCalendar({ camps, emptyMessage, now = new Date() }) {
  const [monthStart, setMonthStart] = useState(() => initialMonth(camps, now));

  const byDay = useMemo(() => indexCampsByDay(camps), [camps]);
  const bounds = useMemo(() => monthBounds(camps), [camps]);
  const grid = useMemo(() => buildMonthGrid(monthStart), [monthStart]);

  if (camps.length === 0) {
    return <p className="py-12 text-muted-foreground">{emptyMessage}</p>;
  }

  // Camps with no date have no cell to occupy. Counting them here means they
  // are acknowledged rather than silently missing from the calendar.
  const datelessCount = camps.filter((camp) => !camp?.startDate).length;

  const monthLabel = formatMonthLabel(monthStart);
  const todayKey = toDayKey(now);

  // Navigation is clamped to the months that actually hold camps. Unclamped,
  // the Past calendar would page into either direction of guaranteed
  // emptiness with no signal about where the data ends.
  const atFirst = bounds.first === null || monthStart <= bounds.first;
  const atLast = bounds.last === null || monthStart >= bounds.last;

  const step = (delta) => setMonthStart((month) => addUtcMonths(month, delta));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={() => step(-1)}
          disabled={atFirst}
          aria-label="Previous month"
        >
          <ChevronIcon direction="left" />
        </Button>

        {/* Announced on change so keyboard and screen-reader users hear where
            the previous/next buttons landed them. */}
        <h2 aria-live="polite" className="text-lg font-semibold">
          {monthLabel}
        </h2>

        <Button
          variant="ghost"
          onClick={() => step(1)}
          disabled={atLast}
          aria-label="Next month"
        >
          <ChevronIcon direction="right" />
        </Button>
      </div>

      {/* Seven columns cannot compress below roughly 44rem without hiding the
          camp titles, so narrow viewports scroll the table instead. */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] table-fixed border-collapse">
          <caption className="sr-only">WordCamps in {monthLabel}</caption>

          <thead>
            <tr>
              {WEEKDAYS.map((weekday) => (
                <th
                  key={weekday.long}
                  scope="col"
                  className="border border-border p-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  <span aria-hidden="true">{weekday.short}</span>
                  <span className="sr-only">{weekday.long}</span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {grid.map((week) => (
              <tr key={toDayKey(week[0])}>
                {week.map((day) => (
                  <DayCell
                    key={toDayKey(day)}
                    day={day}
                    entries={byDay.get(toDayKey(day))}
                    isCurrentMonth={day.getUTCMonth() === monthStart.getUTCMonth()}
                    isToday={toDayKey(day) === todayKey}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {datelessCount > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          {datelessCount} camp{datelessCount === 1 ? "" : "s"} with no scheduled
          date — see the List view.
        </p>
      )}
    </div>
  );
}

/**
 * One day of the grid.
 *
 * Days from the adjacent months are rendered muted rather than blank: a camp
 * on the 31st of the previous month still belongs in the row it shares with
 * this month's opening days.
 *
 * @param {Object} props
 * @param {Date} props.day
 * @param {Array<{camp: Object, isStart: boolean}>} [props.entries]
 * @param {boolean} props.isCurrentMonth
 * @param {boolean} props.isToday
 */
function DayCell({ day, entries, isCurrentMonth, isToday }) {
  return (
    <td
      // aria-current marks today for assistive tech; the colour alone would
      // not carry that meaning.
      aria-current={isToday ? "date" : undefined}
      className={cn(
        "h-24 border border-border p-1 align-top",
        !isCurrentMonth && "bg-muted/30",
      )}
    >
      <span
        className={cn(
          "block px-1 text-xs",
          isCurrentMonth ? "text-muted-foreground" : "text-muted-foreground/50",
          // `primary` as a TEXT accent only — in dark mode it is lightened for
          // contrast and must never become a fill behind primary-foreground.
          isToday && "font-bold text-primary",
        )}
      >
        {day.getUTCDate()}
      </span>

      {entries && (
        <>
          {/* The full date is announced only where there is something to
              announce; adding it to all 42 cells would bury the content. */}
          <span className="sr-only">{formatCampDate(day)}</span>
          <ul className="mt-0.5 space-y-0.5">
            {entries.map(({ camp, isStart }) => (
              <li key={camp.id}>
                <CampChip camp={camp} isStart={isStart} />
              </li>
            ))}
          </ul>
        </>
      )}
    </td>
  );
}

/**
 * A camp inside a day cell.
 *
 * Only the start day links. A three-day camp otherwise costs three identical
 * tab stops and three identical announcements; continuation days stay visible
 * but quiet, so the grid answers "what is happening today" without repeating
 * itself to anyone navigating by keyboard or screen reader.
 *
 * @param {Object} props
 * @param {Object} props.camp Normalized camp.
 * @param {boolean} props.isStart
 */
function CampChip({ camp, isStart }) {
  const base = "block truncate rounded px-1.5 py-0.5 text-xs";

  if (!isStart) {
    return (
      <span className={cn(base, "text-muted-foreground")} title={camp.title}>
        <span className="sr-only">Continues: </span>
        <span aria-hidden="true">↳ </span>
        {camp.title}
      </span>
    );
  }

  // A programme that runs for months is not expanded across the grid, so its
  // duration would otherwise be invisible here. The tooltip and the
  // accessible name carry it; the chip itself has no room.
  const runsUntil = isLongRunning(camp)
    ? ` — runs until ${formatCampDate(camp.endDate)}`
    : "";
  const label = `${camp.title}${runsUntil}`;

  // secondary, never primary: dark-mode --primary is a text accent and fails
  // AA as a fill behind primary-foreground.
  const chip = cn(base, "bg-secondary text-secondary-foreground");
  const content = (
    <>
      {camp.title}
      {runsUntil && <span className="sr-only">{runsUntil}</span>}
    </>
  );

  if (!camp.url) {
    return (
      <span className={chip} title={label}>
        {content}
      </span>
    );
  }

  return (
    <a
      href={camp.url}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className={cn(chip, "hover:bg-accent hover:text-accent-foreground")}
    >
      {content}
    </a>
  );
}

/**
 * Inline SVG rather than an icon dependency, matching ThemeToggle.
 *
 * @param {Object} props
 * @param {"left"|"right"} props.direction
 */
function ChevronIcon({ direction }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}
