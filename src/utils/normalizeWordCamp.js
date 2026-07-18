import { toPlainText } from "@/utils/decodeEntities";
import { parseWordCampDate } from "@/utils/parseDate";

/**
 * Normalize raw WordCamp REST records into the view model the UI renders.
 *
 * This module is the ONLY place that knows the API's field names. Everything
 * downstream — components, grouping, formatting — consumes the clean shape
 * below, so a change in the WordPress meta schema is a one-file change here
 * rather than a hunt through the component tree.
 *
 * Two API quirks drive the implementation (both verified against live data):
 *   1. Meta fields sit at the TOP LEVEL of the record, not under `record.meta`.
 *   2. Unset meta is `""`, not null — so `??` alone would not default it.
 *
 * @typedef {Object} WordCamp
 * @property {number|string} id
 * @property {string} title      Decoded plain text; "" when absent.
 * @property {string} url        Event site, falling back to the central link.
 * @property {Date|null} startDate  null means "Date TBD".
 * @property {Date|null} endDate
 * @property {string} location   "City, Country"; "" when absent.
 * @property {string} venue
 */

/**
 * Read a meta field, treating an empty or whitespace-only string as missing.
 *
 * @param {Object} record
 * @param {string} key
 * @returns {string} Trimmed value, or "".
 */
function readMeta(record, key) {
  const value = record[key];

  return typeof value === "string" ? value.trim() : "";
}

/**
 * Normalize a single record.
 *
 * @param {Object} record Raw record from the WordCamp REST API.
 * @returns {WordCamp|null} null when the record has no usable identity.
 */
export function normalizeWordCamp(record) {
  // An id is the one field that must exist: without it there is nothing to
  // key a list item on, and the record cannot be rendered or deduplicated.
  if (!record || typeof record !== "object" || record.id === undefined) {
    return null;
  }

  return {
    id: record.id,
    // `title.rendered` is HTML — entities decoded, tags stripped, text only.
    title: toPlainText(record.title?.rendered),
    // Prefer the event's own site; fall back to its page on WordCamp Central.
    url: readMeta(record, "URL") || readMeta(record, "link"),
    startDate: parseWordCampDate(record["Start Date (YYYY-mm-dd)"]),
    endDate: parseWordCampDate(record["End Date (YYYY-mm-dd)"]),
    location: readMeta(record, "Location"),
    venue: readMeta(record, "Venue Name"),
  };
}

/**
 * Normalize a list of records, discarding any that cannot be normalized.
 *
 * Dropping is deliberate: a malformed record from a 1,400-record feed should
 * cost that one card, not the whole page.
 *
 * @param {Array<Object>} records
 * @returns {WordCamp[]}
 */
export function normalizeWordCamps(records) {
  if (!Array.isArray(records)) return [];

  return records.map(normalizeWordCamp).filter((camp) => camp !== null);
}
