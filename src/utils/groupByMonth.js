import { formatMonthLabel, DATE_TBD_LABEL } from "@/utils/formatDate";

/**
 * Group camps into the month sections the calendar view renders.
 *
 * Input order is preserved rather than re-sorted. Ordering is
 * `partitionByDate`'s responsibility (upcoming ascending, past descending);
 * re-sorting here would silently override it and flip the Past list back to
 * ascending. This function only segments a list that is already in the order
 * the reader should see.
 *
 * @typedef {Object} MonthGroup
 * @property {string} key   Stable React key, e.g. "2026-03" or "tbd".
 * @property {string} label Heading text, e.g. "March 2026".
 * @property {Array} camps  Camps in this section, in input order.
 */

/** Key for the section holding camps with no date. */
const TBD_KEY = "tbd";

/**
 * Month key for a date, e.g. "2026-03".
 *
 * Year is part of the key so March 2025 and March 2026 stay separate
 * sections, and the month is zero-padded so keys sort lexicographically.
 *
 * @param {Date} date
 * @returns {string}
 */
function monthKey(date) {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${date.getUTCFullYear()}-${month}`;
}

/**
 * Segment camps into consecutive month sections.
 *
 * @param {Array<{startDate: Date|null}>} camps Camps in display order.
 * @returns {MonthGroup[]} Sections in input order, dateless camps last.
 */
export function groupByMonth(camps) {
  if (!Array.isArray(camps)) return [];

  const groups = [];
  const dateless = [];

  for (const camp of camps) {
    if (!camp?.startDate) {
      dateless.push(camp);
      continue;
    }

    const key = monthKey(camp.startDate);
    const openGroup = groups[groups.length - 1];

    // Only extend the section currently open. A month that reappears later in
    // the list opens a NEW section rather than teleporting the camp back into
    // the earlier one, which would break the sorted order the reader sees.
    if (openGroup && openGroup.key === key) {
      openGroup.camps.push(camp);
    } else {
      groups.push({
        key,
        label: formatMonthLabel(camp.startDate),
        camps: [camp],
      });
    }
  }

  if (dateless.length > 0) {
    groups.push({ key: TBD_KEY, label: DATE_TBD_LABEL, camps: dateless });
  }

  return groups;
}
