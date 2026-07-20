// Shared helpers for the E2E specs: a mock of the WordCamp REST endpoint.
//
// Routing the API rather than hitting it live makes the suite deterministic —
// fixed data, fixed dates, instant response — and lets the error spec force a
// failure that the real endpoint would never reliably produce.

const ENDPOINT_GLOB = "**/wp-json/wp/v2/wordcamps*";

/**
 * Build one raw API record in the shape the client expects: meta fields at the
 * TOP level (not under `meta`), the start date as Unix SECONDS in a string.
 */
function record({ id, title, startSeconds, location = "", url = "" }) {
  return {
    id,
    title: { rendered: title },
    "Start Date (YYYY-mm-dd)": startSeconds,
    Location: location,
    URL: url,
  };
}

// 2099 and 2001: far either side of any real "today", so the upcoming/past
// split is stable no matter when the suite runs (the app uses the real clock).
const FUTURE_SECONDS = String(Math.floor(Date.UTC(2099, 2, 14) / 1000));
const PAST_SECONDS = String(Math.floor(Date.UTC(2001, 5, 2) / 1000));

const RECORDS = [
  record({
    id: 1,
    title: "WordCamp Future &#8211; Rome",
    startSeconds: FUTURE_SECONDS,
    location: "Rome, Italy",
    url: "https://rome.wordcamp.org/2099/",
  }),
  record({
    id: 2,
    title: "WordCamp History Osaka",
    startSeconds: PAST_SECONDS,
    location: "Osaka, Japan",
  }),
];

/**
 * Serve the fixture as a single successful page. Sets X-WP-TotalPages to 1 so
 * the client makes exactly one request, and the CORS-expose header the real
 * endpoint sends for it.
 */
async function mockWordCamps(page, records = RECORDS) {
  await page.route(ENDPOINT_GLOB, (route) =>
    route.fulfill({
      status: 200,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
        "x-wp-totalpages": "1",
      },
      body: JSON.stringify(records),
    }),
  );
}

/** Fail every request to the endpoint, to exercise the error state. */
async function failWordCamps(page) {
  await page.route(ENDPOINT_GLOB, (route) =>
    route.fulfill({
      status: 503,
      headers: { "access-control-allow-origin": "*" },
      body: "Service Unavailable",
    }),
  );
}

module.exports = { mockWordCamps, failWordCamps, RECORDS };
