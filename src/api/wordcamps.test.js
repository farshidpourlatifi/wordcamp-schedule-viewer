import { fetchWordCamps, WORDCAMPS_ENDPOINT, PER_PAGE } from "@/api/wordcamps";

/**
 * Build a fake Response. Only the surface the client actually touches is
 * implemented — status, the X-WP-TotalPages header, and json().
 */
const response = (body, { ok = true, status = 200, totalPages = 1 } = {}) => ({
  ok,
  status,
  headers: {
    get: (name) =>
      name.toLowerCase() === "x-wp-totalpages" ? String(totalPages) : null,
  },
  json: async () => body,
});

const record = (id) => ({ id, title: { rendered: `Camp ${id}` } });

describe("fetchWordCamps", () => {
  it("requests page 1 of the WordCamp endpoint with a full page size", () => {
    const fetchImpl = jest.fn(async () => response([record(1)]));

    return fetchWordCamps({ fetchImpl }).then(() => {
      expect(fetchImpl).toHaveBeenCalledTimes(1);

      const url = new URL(fetchImpl.mock.calls[0][0]);
      expect(url.origin + url.pathname).toBe(WORDCAMPS_ENDPOINT);
      expect(url.searchParams.get("per_page")).toBe(String(PER_PAGE));
      expect(url.searchParams.get("page")).toBe("1");
    });
  });

  it("omits the status param by default", async () => {
    const fetchImpl = jest.fn(async () => response([record(1)]));

    await fetchWordCamps({ fetchImpl });

    const url = new URL(fetchImpl.mock.calls[0][0]);
    expect(url.searchParams.has("status")).toBe(false);
  });

  it("adds the status param when one is given", async () => {
    const fetchImpl = jest.fn(async () => response([record(1)]));

    await fetchWordCamps({ fetchImpl, status: "wcpt-scheduled" });

    const url = new URL(fetchImpl.mock.calls[0][0]);
    expect(url.searchParams.get("status")).toBe("wcpt-scheduled");
  });

  it("returns the records from a single-page response", async () => {
    const fetchImpl = jest.fn(async () => response([record(1), record(2)]));

    await expect(fetchWordCamps({ fetchImpl })).resolves.toEqual([
      record(1),
      record(2),
    ]);
  });

  it("follows X-WP-TotalPages and concatenates every page in order", async () => {
    // The live endpoint reports 15 pages at per_page=100; missing the header
    // would silently return only the first 100 of ~1,480 camps.
    const fetchImpl = jest.fn(async (url) => {
      const page = Number(new URL(url).searchParams.get("page"));
      return response([record(page * 10)], { totalPages: 3 });
    });

    const records = await fetchWordCamps({ fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(records.map((r) => r.id)).toEqual([10, 20, 30]);
  });

  it("requests each remaining page exactly once", async () => {
    const fetchImpl = jest.fn(async () => response([], { totalPages: 4 }));

    await fetchWordCamps({ fetchImpl });

    const pages = fetchImpl.mock.calls.map((call) =>
      new URL(call[0]).searchParams.get("page"),
    );
    expect(pages).toEqual(["1", "2", "3", "4"]);
  });

  it("stops after one request when the header reports a single page", async () => {
    const fetchImpl = jest.fn(async () => response([record(1)]));

    await fetchWordCamps({ fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("treats a missing or unparseable page header as one page", async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => [record(1)],
    }));

    await expect(fetchWordCamps({ fetchImpl })).resolves.toEqual([record(1)]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("clamps a non-positive page count to one page", async () => {
    // A finite-but-nonsensical "0" must floor at 1, not drive a zero- or
    // negative-length page loop. Distinct from the NaN path above.
    const fetchImpl = jest.fn(async () => response([record(1)], { totalPages: 0 }));

    await fetchWordCamps({ fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("survives a response that carries no headers object at all", async () => {
    // The optional chain on `response.headers?.get` is what keeps a
    // header-less response from throwing before it can default to one page.
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [record(1)],
    }));

    await expect(fetchWordCamps({ fetchImpl })).resolves.toEqual([record(1)]);
  });

  it("throws with the status when the response is not ok", async () => {
    const fetchImpl = jest.fn(async () =>
      response(null, { ok: false, status: 503 }),
    );

    await expect(fetchWordCamps({ fetchImpl })).rejects.toThrow(
      "WordCamp API request failed (HTTP 503)",
    );
  });

  it("throws when a LATER page fails, rather than returning partial data", async () => {
    // Silently returning page 1 would render a plausible-looking but wrong
    // schedule, which is worse than an honest error state.
    const fetchImpl = jest.fn(async (url) => {
      const page = Number(new URL(url).searchParams.get("page"));
      return page === 1
        ? response([record(1)], { totalPages: 2 })
        : response(null, { ok: false, status: 500 });
    });

    await expect(fetchWordCamps({ fetchImpl })).rejects.toThrow("HTTP 500");
  });

  it("propagates a network-level failure", async () => {
    const fetchImpl = jest.fn(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(fetchWordCamps({ fetchImpl })).rejects.toThrow(
      "Failed to fetch",
    );
  });

  it("throws when the payload is not an array", async () => {
    // A WP error object (`{code, message}`) is a 200 with a non-array body;
    // passing it downstream would break the normalizer with a confusing error.
    const fetchImpl = jest.fn(async () =>
      response({ code: "rest_invalid", message: "nope" }),
    );

    await expect(fetchWordCamps({ fetchImpl })).rejects.toThrow(
      "WordCamp API returned an unexpected payload",
    );
  });

  it("passes the abort signal through to fetch", async () => {
    // TanStack Query aborts in-flight requests; without this the app keeps
    // paging through 15 requests nobody is waiting for.
    const fetchImpl = jest.fn(async () => response([record(1)]));
    const signal = new AbortController().signal;

    await fetchWordCamps({ fetchImpl, signal });

    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ signal });
  });
});
