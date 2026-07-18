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

/** The only schemes safe to put in an href. */
const SAFE_URL_PROTOCOLS = ["http:", "https:"];

/**
 * Read a meta field as a link target, rejecting anything that is not http(s).
 *
 * These values end up in `<a href>`, which is an executable sink: a
 * `javascript:` URL runs script on click, and `data:text/html` opens
 * attacker-controlled markup in the site's context. The API is a trusted
 * source today, but "trusted source" is not a security control — a single
 * compromised or mis-edited camp record would otherwise reach the sink.
 *
 * Anything unparseable or non-http(s) yields "", which the UI renders as a
 * plain title with no link at all.
 *
 * @param {Object} record
 * @param {string} key
 * @returns {string} A safe absolute URL, or "".
 */
function readSafeUrl(record, key) {
  const raw = readMeta(record, key);
  if (raw === "") return "";

  try {
    // The URL parser normalizes case and strips embedded tabs/newlines, so
    // "JavaScript:" and "java\nscript:" are both caught by this check.
    const { protocol } = new URL(raw);

    return SAFE_URL_PROTOCOLS.includes(protocol) ? raw : "";
  } catch {
    // Not an absolute URL — nothing safe to link to.
    return "";
  }
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
    // Both are scheme-checked — either can carry a hostile value.
    url: readSafeUrl(record, "URL") || readSafeUrl(record, "link"),
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
