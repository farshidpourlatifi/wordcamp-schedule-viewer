import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Render a tree inside a fresh QueryClient.
 *
 * A new client per call is the point: a shared one is a global cache, so one
 * test's fetched data could satisfy another test's query and make a failing
 * component look like it works. Retries are off so an error-path test reports
 * failure immediately instead of waiting out the backoff.
 *
 * @param {React.ReactElement} ui
 * @returns {ReturnType<typeof render>}
 */
export function renderWithQuery(ui) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

/**
 * Build a fake WordCamp API Response with a single page of records.
 *
 * @param {Array} records
 * @returns {Object}
 */
export function apiResponse(records) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => "1" },
    json: async () => records,
  };
}

/**
 * Build a raw API record. Mirrors the live payload's quirks: meta at the top
 * level, dates as Unix-seconds strings.
 *
 * @param {Object} fields
 * @returns {Object}
 */
export function apiRecord({
  id,
  title,
  startSeconds,
  location = "",
  url = "",
}) {
  return {
    id,
    title: { rendered: title },
    "Start Date (YYYY-mm-dd)": startSeconds,
    Location: location,
    URL: url,
  };
}
