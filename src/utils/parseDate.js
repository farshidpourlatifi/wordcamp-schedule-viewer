/**
 * Parsing for the WordCamp date meta.
 *
 * The API's key name is a trap: `Start Date (YYYY-mm-dd)` does NOT hold a
 * `YYYY-mm-dd` string. Verified against live records, it holds a Unix
 * timestamp in SECONDS, as a string — e.g. `"1786233600"`. Unset meta comes
 * back as `""` rather than null.
 *
 * ISO strings are accepted too. The WordCamp meta schema has changed before,
 * and accepting both shapes costs one branch while removing a whole class of
 * future breakage.
 */

/** Milliseconds per second — the API's unit vs. JavaScript's. */
const MS_PER_SECOND = 1000;

/** Matches an integer string, optionally signed: the Unix-seconds shape. */
const INTEGER_PATTERN = /^-?\d+$/;

/**
 * Convert Unix seconds to a Date, rejecting values that cannot be a real
 * event date.
 *
 * @param {number} seconds
 * @returns {Date|null}
 */
function fromUnixSeconds(seconds) {
  // 0 is WordPress's "cleared timestamp", and no WordCamp predates 1970, so
  // anything at or below the epoch is missing data rather than a date.
  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  const date = new Date(seconds * MS_PER_SECOND);

  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Parse a WordCamp date meta value into a Date.
 *
 * Returns null — never an Invalid Date — for anything unparseable. This is
 * deliberate: an Invalid Date is truthy AND `instanceof Date`, so it slips
 * through a null check and only explodes later at format time, far from the
 * bad input. A null forces the "Date TBD" path at the point of the problem.
 *
 * @param {string|number|null|undefined} value Raw meta value.
 * @returns {Date|null} A valid Date, or null when there is no usable date.
 */
export function parseWordCampDate(value) {
  if (typeof value === "number") return fromUnixSeconds(value);

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (trimmed === "") return null;

  // Unix seconds — the format the live API actually returns.
  if (INTEGER_PATTERN.test(trimmed)) return fromUnixSeconds(Number(trimmed));

  // Otherwise assume an ISO-ish date string and let the engine decide.
  const timestamp = Date.parse(trimmed);

  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}
