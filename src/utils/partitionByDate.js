/**
 * Split normalized WordCamps into "upcoming" and "past".
 *
 * The clock is a parameter rather than a `new Date()` buried in the function
 * body. That is what makes this testable: every assertion in the suite is
 * relative to a fixed instant, so the tests cannot rot the day after they are
 * written.
 */

/**
 * Start of the UTC day containing `date`, as a timestamp.
 *
 * Comparison happens at DAY granularity, not instant granularity, because
 * WordCamp dates are day-precision events. `startDate >= now` would file a
 * camp starting 00:00 today as "past" from 00:01 onward — while the event is
 * actually happening. UTC (not local time) keeps the boundary deterministic
 * regardless of where the viewer or the CI runner sits.
 *
 * @param {Date} date
 * @returns {number} Epoch ms at 00:00:00 UTC on that date.
 */
function startOfUtcDay(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Partition camps by date, sorting each side toward today.
 *
 * @param {Array<{startDate: Date|null}>} camps Normalized camps.
 * @param {Date} [now] Injectable clock; defaults to the real one.
 * @returns {{upcoming: Array, past: Array}} Upcoming ascending (soonest
 *   first), past descending (most recent first), dateless camps last in past.
 */
export function partitionByDate(camps, now = new Date()) {
  if (!Array.isArray(camps)) return { upcoming: [], past: [] };

  const today = startOfUtcDay(now);

  const upcoming = [];
  const past = [];
  // Kept separate so they can be appended after past is sorted — a null date
  // has no meaningful position in a chronological ordering.
  const dateless = [];

  for (const camp of camps) {
    if (!camp?.startDate) {
      dateless.push(camp);
    } else if (startOfUtcDay(camp.startDate) >= today) {
      upcoming.push(camp);
    } else {
      past.push(camp);
    }
  }

  // Array.prototype.sort is stable per spec, so equally-dated camps keep the
  // API's own ordering instead of reshuffling between renders.
  upcoming.sort((a, b) => a.startDate - b.startDate);
  past.sort((a, b) => b.startDate - a.startDate);

  return { upcoming, past: [...past, ...dateless] };
}
