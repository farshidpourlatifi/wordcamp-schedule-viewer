/**
 * Filter normalized camps by a text query and a region.
 *
 * A single pure predicate, applied to whatever list a view hands it (the whole
 * timeline for the calendar, one tab's side for the list and map). Keeping it
 * here — not inside a component — means the same filtering is guaranteed
 * identical across all three views and is testable without rendering anything.
 *
 * @typedef {Object} CampFilters
 * @property {string} [query]  Free text; matched against title, location,
 *   country, and venue, case-insensitively.
 * @property {string} [region] A continent name, or "" / "All" for no region
 *   constraint.
 */

/** Region value meaning "no continent filter". */
export const ALL_REGIONS = "All";

/**
 * True when a camp matches every word of the query.
 *
 * Token-AND rather than a single substring: "rome italy" matches an event whose
 * title says Rome and whose country says Italy, even though that exact phrase
 * appears nowhere. That is how people expect search to behave, and it lets a
 * query span fields without caring about their order.
 *
 * @param {Object} camp
 * @param {string[]} tokens Lower-cased, non-empty query words.
 * @returns {boolean}
 */
function matchesQuery(camp, tokens) {
  if (tokens.length === 0) return true;

  const haystack = [camp.title, camp.location, camp.country, camp.venue]
    .join(" ")
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

/**
 * True when a camp matches the region constraint.
 *
 * @param {Object} camp
 * @param {string} region
 * @returns {boolean}
 */
function matchesRegion(camp, region) {
  if (!region || region === ALL_REGIONS) return true;

  return camp.continent === region;
}

/**
 * @param {Array} camps Normalized camps.
 * @param {CampFilters} [filters]
 * @returns {Array} The camps that match every active filter, in input order.
 */
export function filterCamps(camps, filters = {}) {
  if (!Array.isArray(camps)) return [];

  const tokens = (filters.query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  const region = filters.region ?? ALL_REGIONS;
  const regionActive = region !== ALL_REGIONS && region !== "";

  // No active filter: return the same array reference, so a view can skip
  // re-rendering when nothing is being narrowed.
  if (tokens.length === 0 && !regionActive) return camps;

  return camps.filter(
    (camp) => matchesQuery(camp, tokens) && matchesRegion(camp, region),
  );
}
