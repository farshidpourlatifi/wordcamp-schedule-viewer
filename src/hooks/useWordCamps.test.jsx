import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useWordCamps } from "@/hooks/useWordCamps";

/** Fixed clock — the upcoming/past split below is relative to this instant. */
const NOW = new Date("2026-07-18T12:00:00.000Z");

const record = (id, title, startSeconds) => ({
  id,
  title: { rendered: title },
  "Start Date (YYYY-mm-dd)": startSeconds,
  URL: `https://camp-${id}.wordcamp.org/`,
});

const response = (body) => ({
  ok: true,
  status: 200,
  headers: { get: () => "1" },
  json: async () => body,
});

/**
 * Wrap the hook in a fresh QueryClient per test.
 *
 * Retries are off: with them on, an error-path test waits out the backoff
 * before the hook ever reports failure. A per-test client also stops one
 * test's cache from answering another's query.
 */
function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  // eslint-disable-next-line react/display-name
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const renderUseWordCamps = (options) =>
  renderHook(() => useWordCamps({ now: NOW, ...options }), {
    wrapper: wrapper(),
  });

describe("useWordCamps", () => {
  it("reports loading before any data arrives", () => {
    const fetchImpl = jest.fn(async () => response([]));

    const { result } = renderUseWordCamps({ fetchImpl });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);
    expect(result.current.upcoming).toEqual([]);
    expect(result.current.past).toEqual([]);
  });

  it("resolves to camps partitioned around the injected clock", async () => {
    const fetchImpl = jest.fn(async () =>
      response([
        // 2026-09-01 — after NOW
        record(1, "Future Camp", "1788220800"),
        // 2026-01-15 — before NOW
        record(2, "Past Camp", "1768435200"),
      ]),
    );

    const { result } = renderUseWordCamps({ fetchImpl });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.upcoming.map((c) => c.title)).toEqual([
      "Future Camp",
    ]);
    expect(result.current.past.map((c) => c.title)).toEqual(["Past Camp"]);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("returns camps already normalized, not raw records", async () => {
    const fetchImpl = jest.fn(async () =>
      response([record(1, "Rome &#8211; 2026", "1788220800")]),
    );

    const { result } = renderUseWordCamps({ fetchImpl });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.upcoming[0]).toEqual({
      id: 1,
      title: "Rome – 2026",
      url: "https://camp-1.wordcamp.org/",
      startDate: new Date("2026-09-01T00:00:00.000Z"),
      endDate: null,
      location: "",
      venue: "",
      coordinates: null,
      timezone: "",
      attendees: null,
      countryCode: "",
      country: "",
      continent: "Unknown",
    });
  });

  it("reports the error when the request fails", async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: false,
      status: 503,
      headers: { get: () => null },
      json: async () => null,
    }));

    const { result } = renderUseWordCamps({ fetchImpl });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe(
      "WordCamp API request failed (HTTP 503)",
    );
    // Empty lists, not undefined — the UI can render an error state without
    // guarding every array access.
    expect(result.current.upcoming).toEqual([]);
    expect(result.current.past).toEqual([]);
  });

  it("hands the query's abort signal to the API client", async () => {
    const fetchImpl = jest.fn(async () => response([]));

    const { result } = renderUseWordCamps({ fetchImpl });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(fetchImpl.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("loads the past archive only when requested", async () => {
    const statusOf = (url) => new URL(url).searchParams.get("status");
    const fetchImpl = jest.fn((url) => {
      const status = statusOf(url);
      if (status === "wcpt-scheduled") {
        return Promise.resolve(response([record(1, "Future Camp", "1788220800")]));
      }
      if (status === "wcpt-closed") {
        return Promise.resolve(response([record(2, "Past Camp", "1768435200")]));
      }
      return Promise.resolve(response([])); // count query
    });

    const { result } = renderUseWordCamps({ fetchImpl });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Upcoming is there; the past archive has not been touched.
    expect(result.current.upcoming.map((c) => c.title)).toEqual(["Future Camp"]);
    expect(result.current.past).toEqual([]);
    expect(result.current.isArchiveLoaded).toBe(false);
    const requestedStatuses = () =>
      fetchImpl.mock.calls.map(([url]) => statusOf(url));
    expect(requestedStatuses()).not.toContain("wcpt-closed");

    // Request it → the closed feed loads → past fills in.
    act(() => result.current.requestArchive());
    await waitFor(() => expect(result.current.isArchiveLoaded).toBe(true));
    expect(result.current.past.map((c) => c.title)).toEqual(["Past Camp"]);
    expect(requestedStatuses()).toContain("wcpt-closed");
  });

  it("fetches the eager feeds once per mount, not once per render", async () => {
    const fetchImpl = jest.fn(async () => response([]));

    const { result, rerender } = renderUseWordCamps({ fetchImpl });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    rerender();
    rerender();

    // Count + scheduled up front (the archive is lazy), and re-rendering adds
    // none.
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("falls back to the global fetch and the real clock when called bare", async () => {
    // This is how app code calls it — with no arguments at all. Exercising it
    // proves the injectable defaults actually work, rather than only ever
    // testing the injected path and shipping an untested default.
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async () => response([]));

    try {
      const { result } = renderHook(() => useWordCamps(), {
        wrapper: wrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Count + scheduled; the archive stays lazy.
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.current.isError).toBe(false);
      expect(result.current.upcoming).toEqual([]);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("keeps list identity stable across re-renders", async () => {
    // The lists feed a memoized calendar view; a new array every render would
    // defeat that and re-render every card on any state change.
    const fetchImpl = jest.fn(async () =>
      response([record(1, "Camp", "1788220800")]),
    );

    const { result, rerender } = renderUseWordCamps({ fetchImpl });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const firstUpcoming = result.current.upcoming;
    rerender();

    expect(result.current.upcoming).toBe(firstUpcoming);
  });
});
