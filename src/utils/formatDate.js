/**
 * Date formatting for display.
 *
 * Everything formats in UTC. WordCamp dates are day-precision values stored as
 * midnight UTC, so formatting in the viewer's local zone would show "13 Mar"
 * to anyone west of Greenwich for an event the API calls the 14th. Fixing the
 * zone also makes the output identical in every test environment.
 */

/** Shown wherever a camp has no usable date. Matches the design system copy. */
export const DATE_TBD_LABEL = "Date TBD";

/** e.g. "Sat, 14 Mar 2026" */
const CAMP_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** e.g. "March 2026" */
const MONTH_LABEL_FORMAT = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * True when the value is a Date that actually represents a moment in time.
 * `new Date("nonsense")` passes `instanceof Date` but has a NaN timestamp.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * Format a camp's date for a card.
 *
 * @param {Date|null} date
 * @returns {string} e.g. "Sat, 14 Mar 2026", or "Date TBD".
 */
export function formatCampDate(date) {
  if (!isValidDate(date)) return DATE_TBD_LABEL;

  // en-GB renders this as "Sat, 14 Mar 2026" — day before month, no comma
  // after the day, which is the format the design system specifies.
  return CAMP_DATE_FORMAT.format(date);
}

/**
 * Format a month-section heading.
 *
 * @param {Date|null} date Any date within the month.
 * @returns {string} e.g. "March 2026", or "Date TBD".
 */
export function formatMonthLabel(date) {
  if (!isValidDate(date)) return DATE_TBD_LABEL;

  return MONTH_LABEL_FORMAT.format(date);
}
