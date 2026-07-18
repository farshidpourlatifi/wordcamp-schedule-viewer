/**
 * Client for the WordCamp Central WP REST API.
 *
 * `fetch` is injected rather than referenced directly so tests can drive every
 * path — multi-page, HTTP error, network failure — with no network access and
 * no global patching.
 *
 * Note on payload size: the endpoint supports `_fields` to trim responses, but
 * it silently drops any field whose name contains a space or parentheses.
 * `Start Date (YYYY-mm-dd)` is exactly that shape, so requesting a field list
 * returns records with no dates at all. Full records it is.
 */

/** The WordCamps custom-post-type collection. */
export const WORDCAMPS_ENDPOINT =
  "https://central.wordcamp.org/wp-json/wp/v2/wordcamps";

/** WordPress caps per_page at 100; fewer pages means fewer round trips. */
export const PER_PAGE = 100;

/**
 * Runaway guard. The live feed is ~15 pages; this only trips if the API
 * reports a nonsense page count, and stops that from becoming thousands of
 * requests from a user's browser.
 */
const MAX_PAGES = 50;

/**
 * Build the collection URL for one page.
 *
 * @param {number} page 1-based page number.
 * @returns {string}
 */
function buildPageUrl(page) {
  const url = new URL(WORDCAMPS_ENDPOINT);

  url.searchParams.set("per_page", String(PER_PAGE));
  url.searchParams.set("page", String(page));

  return url.toString();
}

/**
 * Read the total page count from the response headers.
 *
 * WordPress reports it in `X-WP-TotalPages` (CORS-exposed by this endpoint, so
 * a browser can actually read it). Anything missing or unparseable is treated
 * as a single page rather than guessed at.
 *
 * @param {Response} response
 * @returns {number}
 */
function readTotalPages(response) {
  const raw = response.headers?.get("X-WP-TotalPages");
  const total = Number.parseInt(raw, 10);

  if (!Number.isFinite(total) || total < 1) return 1;

  return Math.min(total, MAX_PAGES);
}

/**
 * Fetch and validate one page.
 *
 * @param {number} page
 * @param {Function} fetchImpl
 * @param {AbortSignal} [signal]
 * @returns {Promise<{records: Array, totalPages: number}>}
 */
async function fetchPage(page, fetchImpl, signal) {
  const response = await fetchImpl(buildPageUrl(page), { signal });

  if (!response.ok) {
    throw new Error(`WordCamp API request failed (HTTP ${response.status})`);
  }

  const records = await response.json();

  // A WordPress error is a 200 carrying `{code, message}`. Catching it here
  // gives a clear message instead of a confusing crash in the normalizer.
  if (!Array.isArray(records)) {
    throw new Error("WordCamp API returned an unexpected payload");
  }

  return { records, totalPages: readTotalPages(response) };
}

/**
 * Fetch every WordCamp record, following pagination.
 *
 * Page 1 is fetched first because its headers reveal how many pages exist;
 * the remainder are then fetched concurrently, since ~15 sequential round
 * trips would dominate the app's load time.
 *
 * Any failed page rejects the whole call. Returning partial data would render
 * a plausible-looking but wrong schedule — worse than an honest error state.
 *
 * @param {Object} [options]
 * @param {Function} [options.fetchImpl] Injectable fetch, for tests.
 * @param {AbortSignal} [options.signal] Cancels in-flight requests.
 * @returns {Promise<Array<Object>>} Raw records, in page order.
 */
export async function fetchWordCamps({
  // Wrapped rather than passed by reference: an unbound `globalThis.fetch`
  // throws "Illegal invocation" in the browser.
  fetchImpl = (...args) => globalThis.fetch(...args),
  signal,
} = {}) {
  const firstPage = await fetchPage(1, fetchImpl, signal);

  if (firstPage.totalPages <= 1) return firstPage.records;

  const remainingPages = Array.from(
    { length: firstPage.totalPages - 1 },
    (_, index) => index + 2,
  );

  const rest = await Promise.all(
    remainingPages.map((page) => fetchPage(page, fetchImpl, signal)),
  );

  return [firstPage.records, ...rest.map((page) => page.records)].flat();
}
