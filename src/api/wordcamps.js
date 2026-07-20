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
 * WordCamp statuses. Verified against the live feed, these two partition it
 * exactly: scheduled (~40, upcoming) + closed (~1,441, past) = the full ~1,481.
 * So each side can be fetched — and lazily loaded — on its own, which is the
 * only server-side lever the API offers: the event date and venue location are
 * meta fields it will not filter or sort by.
 */
export const SCHEDULED_STATUS = "wcpt-scheduled";
export const CLOSED_STATUS = "wcpt-closed";

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
 * @param {string} [status] Filters to one WordPress status when set.
 * @returns {string}
 */
function buildPageUrl(page, status) {
  const url = new URL(WORDCAMPS_ENDPOINT);

  url.searchParams.set("per_page", String(PER_PAGE));
  url.searchParams.set("page", String(page));
  if (status) url.searchParams.set("status", status);

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
 * Fetch the total record count without downloading the records.
 *
 * WordPress reports the collection size in the `X-WP-Total` header, so one
 * `per_page=1` request reads the whole feed's size (~1,481) for the cost of a
 * single record. Used to show an honest total before the archive is loaded.
 *
 * @param {Object} [options]
 * @param {Function} [options.fetchImpl]
 * @param {AbortSignal} [options.signal]
 * @param {string} [options.status] Count one status instead of the whole feed.
 * @returns {Promise<number>} Total records, or 0 when the header is missing.
 */
export async function fetchWordCampCount({
  fetchImpl = (...args) => globalThis.fetch(...args),
  signal,
  status,
} = {}) {
  const url = new URL(WORDCAMPS_ENDPOINT);
  url.searchParams.set("per_page", "1");
  if (status) url.searchParams.set("status", status);

  const response = await fetchImpl(url.toString(), { signal });

  if (!response.ok) {
    throw new Error(`WordCamp API request failed (HTTP ${response.status})`);
  }

  const total = Number.parseInt(response.headers?.get("X-WP-Total"), 10);

  return Number.isFinite(total) && total >= 0 ? total : 0;
}

/**
 * Fetch and validate one page.
 *
 * @param {number} page
 * @param {Function} fetchImpl
 * @param {AbortSignal} [signal]
 * @returns {Promise<{records: Array, totalPages: number}>}
 */
async function fetchPage(page, fetchImpl, signal, status) {
  const response = await fetchImpl(buildPageUrl(page, status), { signal });

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
 * @param {string} [options.status] Restrict to one WordPress status.
 * @returns {Promise<Array<Object>>} Raw records, in page order.
 */
export async function fetchWordCamps({
  // Wrapped rather than passed by reference: an unbound `globalThis.fetch`
  // throws "Illegal invocation" in the browser.
  fetchImpl = (...args) => globalThis.fetch(...args),
  signal,
  status,
} = {}) {
  const firstPage = await fetchPage(1, fetchImpl, signal, status);

  if (firstPage.totalPages <= 1) return firstPage.records;

  const remainingPages = Array.from(
    { length: firstPage.totalPages - 1 },
    (_, index) => index + 2,
  );

  const rest = await Promise.all(
    remainingPages.map((page) => fetchPage(page, fetchImpl, signal, status)),
  );

  return [firstPage.records, ...rest.map((page) => page.records)].flat();
}
