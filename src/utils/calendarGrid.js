/**
 * Date math for the month-grid calendar.
 *
 * Everything here works in UTC, for the same reason `formatDate` formats in
 * UTC: WordCamp dates are day-precision values stored as midnight UTC, so
 * doing the arithmetic in the viewer's local zone would drop a camp into the
 * wrong day cell for anyone west of Greenwich. Keeping the whole pipeline —
 * parse, partition, grid, format — on one clock also makes every test
 * deterministic regardless of where CI runs.
 *
 * These are pure functions with no React and no DOM, which is where this
 * project puts the bulk of its coverage.
 */

/**
 * Weekday column headers, Monday first.
 *
 * ISO 8601 starts the week on Monday and the app formats `en-GB` throughout;
 * Sunday-first is a US convention and WordCamps are a global event series.
 * Both forms are kept because the header shows the short label visually while
 * screen readers get the unambiguous long one.
 */
export const WEEKDAYS = [
  { short: "Mon", long: "Monday" },
  { short: "Tue", long: "Tuesday" },
  { short: "Wed", long: "Wednesday" },
  { short: "Thu", long: "Thursday" },
  { short: "Fri", long: "Friday" },
  { short: "Sat", long: "Saturday" },
  { short: "Sun", long: "Sunday" },
];

export const DAYS_PER_WEEK = 7;

/**
 * Rows in every grid, always six.
 *
 * A month needs five rows usually and six occasionally (a 31-day month
 * starting on a Sunday). Rendering a fixed six keeps the table the same
 * height in every month, so paging with prev/next does not make the page
 * jump under the pointer.
 */
export const WEEKS_PER_GRID = 6;

/**
 * Longest span the index will expand across every day, in days.
 *
 * Not an arbitrary guard. Measured against the live feed (91 dated records,
 * 2026-07-20), spans fall into two populations:
 *
 *   conferences  1 day x44, 2 x28, 3 x3, 4 x1, 8 x1
 *   programmes   15+ days x14, the longest running 149
 *
 * The long tail is not corrupt data — "WordPress Campus Connect" entries are
 * multi-month campus programmes, not events you attend on a day. Expanding
 * those across every day they cover carpets weeks of the grid with one
 * repeated title and buries the single-day camps around them, so anything
 * past a week is indexed on its start day alone and carries its end date
 * instead. Seven days is the line because no conference in the feed runs
 * longer than eight.
 */
export const MAX_EXPANDED_SPAN_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * True when the value is a Date representing a real moment.
 * `new Date("nonsense")` passes `instanceof Date` but holds NaN.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * First day of the UTC month containing `date`.
 *
 * @param {Date} date
 * @returns {Date} Midnight UTC on the 1st.
 */
export function startOfUtcMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * Shift a month start by `delta` months.
 *
 * `Date.UTC` normalizes out-of-range months on its own — month -1 is the
 * previous December, month 12 is next January — so year rollover needs no
 * special case in either direction.
 *
 * @param {Date} monthStart First of some month.
 * @param {number} delta Months to add; may be negative.
 * @returns {Date} First of the resulting month.
 */
export function addUtcMonths(monthStart, delta) {
  return new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + delta, 1),
  );
}

/**
 * Stable day key for indexing and React keys, e.g. "2026-03-14".
 *
 * Zero-padded so keys sort lexicographically, matching the "2026-03" month
 * key format `groupByMonth` already uses.
 *
 * @param {Date} date
 * @returns {string}
 */
export function toDayKey(date) {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${date.getUTCFullYear()}-${month}-${day}`;
}

/**
 * How many days to reach back so the grid starts on a Monday.
 *
 * `getUTCDay()` is Sunday-based (0=Sun). Rotating by 6 maps Monday to 0 and
 * Sunday to 6, which is the offset of the month's first day within a
 * Monday-first week — and therefore the number of trailing days needed from
 * the previous month.
 *
 * @param {Date} monthStart
 * @returns {number} 0-6
 */
function leadingDayCount(monthStart) {
  return (monthStart.getUTCDay() + 6) % DAYS_PER_WEEK;
}

/**
 * Build the 6x7 matrix of days covering a month, Monday first.
 *
 * Leading and trailing cells come from the adjacent months rather than being
 * blank. They are rendered muted, but they are real days: a camp on the 31st
 * of the previous month should still be visible in the row it shares with
 * this month's opening days.
 *
 * @param {Date} monthStart First of the month to render.
 * @returns {Date[][]} WEEKS_PER_GRID rows of DAYS_PER_WEEK Dates.
 */
export function buildMonthGrid(monthStart) {
  const firstCell = Date.UTC(
    monthStart.getUTCFullYear(),
    monthStart.getUTCMonth(),
    1 - leadingDayCount(monthStart),
  );

  return Array.from({ length: WEEKS_PER_GRID }, (_, week) =>
    Array.from(
      { length: DAYS_PER_WEEK },
      (_, day) =>
        new Date(firstCell + (week * DAYS_PER_WEEK + day) * MS_PER_DAY),
    ),
  );
}

/**
 * Number of days a camp occupies, inclusive of both ends.
 *
 * A missing, invalid, or backwards end date degrades to a single day rather
 * than throwing — the same defensive posture `normalizeWordCamp` takes with
 * every other optional meta field.
 *
 * @param {Date} start
 * @param {Date|null} end
 * @returns {number} At least 1.
 */
export function campSpanDays(start, end) {
  if (!isValidDate(start) || !isValidDate(end)) return 1;

  const days = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

  return Math.max(days, 1);
}

/**
 * True for camps that run longer than a conference does.
 *
 * Shared by the index and the view so the two cannot disagree about which
 * camps get expanded across the grid and which advertise their end date
 * instead.
 *
 * @param {{startDate: Date|null, endDate: Date|null}} camp
 * @returns {boolean}
 */
export function isLongRunning(camp) {
  return campSpanDays(camp?.startDate, camp?.endDate) > MAX_EXPANDED_SPAN_DAYS;
}

/**
 * Index camps by the days they occupy.
 *
 * Conference-length camps are expanded across their whole span so the grid
 * can answer "what is happening on this day", which is the one question a
 * calendar exists to answer. Each entry carries `isStart` so the view can
 * render the start day as a link and the continuation days as quiet,
 * non-interactive chips — a camp then costs exactly one tab stop no matter
 * how long it runs.
 *
 * Long-running programmes (see MAX_EXPANDED_SPAN_DAYS) are indexed only on
 * their start day. They are still fully present; the view shows their end
 * date rather than repeating them down weeks of cells.
 *
 * Dateless camps are skipped: they have no cell to occupy. The caller
 * surfaces them separately so they are not silently dropped.
 *
 * @param {Array<{startDate: Date|null, endDate: Date|null}>} camps
 * @returns {Map<string, Array<{camp: Object, isStart: boolean}>>} Keyed by day.
 */
export function indexCampsByDay(camps) {
  const index = new Map();
  if (!Array.isArray(camps)) return index;

  for (const camp of camps) {
    if (!isValidDate(camp?.startDate)) continue;

    const span = isLongRunning(camp)
      ? 1
      : campSpanDays(camp.startDate, camp.endDate);

    for (let offset = 0; offset < span; offset += 1) {
      const day = new Date(camp.startDate.getTime() + offset * MS_PER_DAY);
      const key = toDayKey(day);
      const entry = { camp, isStart: offset === 0 };

      const existing = index.get(key);
      if (existing) existing.push(entry);
      else index.set(key, [entry]);
    }
  }

  return index;
}

/**
 * Earliest and latest month present in a list of camps.
 *
 * Month navigation clamps to this range. Without it, the Past calendar would
 * happily page into either direction of guaranteed emptiness — there are
 * ~219 months of history and no signal to the reader about where it ends.
 *
 * @param {Array<{startDate: Date|null}>} camps
 * @returns {{first: Date|null, last: Date|null}} First-of-month Dates, or
 *   nulls when no camp has a usable date.
 */
export function monthBounds(camps) {
  if (!Array.isArray(camps)) return { first: null, last: null };

  let first = null;
  let last = null;

  for (const camp of camps) {
    if (!isValidDate(camp?.startDate)) continue;

    const month = startOfUtcMonth(camp.startDate);
    if (first === null || month < first) first = month;
    if (last === null || month > last) last = month;
  }

  return { first, last };
}
