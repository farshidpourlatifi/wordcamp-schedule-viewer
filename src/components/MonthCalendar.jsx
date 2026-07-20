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
 * First month to display: today's, pulled into the range that holds camps.
 *
 * The calendar is one continuous timeline rather than an upcoming/past split,
 * so "now" is the honest place to open — it is where the reader already is,
 * with recent camps one click back and the next ones in view. Clamping keeps
 * the opening grid populated if the feed happens not to reach today.
 *
 * @param {Array<{startDate: Date|null}>} camps
 * @param {Date} now
 * @returns {Date} First of the month to render.
 */
function initialMonth(camps, now) {
  const today = startOfUtcMonth(now);
  const { first, last } = monthBounds(camps);

  if (first !== null && today < first) return first;
  if (last !== null && today > last) return last;

  return today;
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
  const todayMonth = startOfUtcMonth(now);

  // "Today" is only offered when it would actually land somewhere: not while
  // it is already on screen, and not when the feed does not reach this month.
  const todayInRange =
    bounds.first !== null &&
    todayMonth >= bounds.first &&
    todayMonth <= bounds.last;
  const canJumpToToday =
    todayInRange && todayMonth.getTime() !== monthStart.getTime();

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

        <div className="flex items-center gap-3">
          {/* Announced on change so keyboard and screen-reader users hear
              where the previous/next buttons landed them. */}
          <h2 aria-live="polite" className="text-lg font-semibold">
            {monthLabel}
          </h2>

          <Button
            onClick={() => setMonthStart(todayMonth)}
            disabled={!canJumpToToday}
            className="px-3 py-1 text-xs"
            // The date is spelled out rather than left as "Today", so the
            // control says where it goes without needing the grid for context.
            aria-label={`Go to today, ${formatCampDate(now)}`}
            title={`Today is ${formatCampDate(now)}`}
          >
            Today
          </Button>
        </div>

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
        // An inset ring rather than a fill: it reads at a glance in both
        // themes without putting text on a `primary` background.
        isToday && "ring-2 ring-inset ring-primary",
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
        {isToday && <span className="sr-only"> (today)</span>}
      </span>

      {entries && (
        <>
          {/* The full date is announced only where there is something to
              announce; adding it to all 42 cells would bury the content. */}
          <span className="sr-only">{formatCampDate(day)}</span>
          {/* space-y-1 keeps 4px between adjacent targets, which the same
              WCAG criterion counts toward safe clickable space. */}
          <ul className="mt-1 space-y-1">
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
  // min-h-6 is 24px: WCAG 2.5.8 (Target Size, Minimum) at AA. Text-xs alone
  // gives a 20px chip, which Lighthouse flagged on the deployed build — the
  // links are small by nature in a day cell, so the height is set explicitly
  // rather than left to the line box.
  // 16px line box + 4px padding either side = the 24px minimum, with
  // `block` kept so `truncate` still ellipsises the long titles.
  const base = "block truncate rounded px-1.5 py-1 text-xs leading-4";

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
