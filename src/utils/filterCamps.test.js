import { filterCamps, ALL_REGIONS } from "@/utils/filterCamps";

const camp = (overrides = {}) => ({
  id: 1,
  title: "WordCamp Rome",
  location: "Rome, Italy",
  country: "Italy",
  venue: "Palazzo dei Congressi",
  continent: "Europe",
  ...overrides,
});

const titles = (camps) => camps.map((c) => c.title);

describe("filterCamps", () => {
  const rome = camp({ id: 1, title: "WordCamp Rome" });
  const osaka = camp({
    id: 2,
    title: "WordCamp Osaka",
    location: "Osaka, Japan",
    country: "Japan",
    venue: "Grand Front",
    continent: "Asia",
  });
  const all = [rome, osaka];

  it("returns everything when no filter is active", () => {
    expect(filterCamps(all)).toBe(all); // filters omitted entirely
    expect(filterCamps(all, {})).toBe(all); // same reference — nothing narrowed
    expect(filterCamps(all, { query: "", region: ALL_REGIONS })).toBe(all);
  });

  it("matches the query against the title", () => {
    expect(titles(filterCamps(all, { query: "osaka" }))).toEqual([
      "WordCamp Osaka",
    ]);
  });

  it("matches the query against location, country, and venue", () => {
    expect(titles(filterCamps(all, { query: "italy" }))).toEqual([
      "WordCamp Rome",
    ]);
    expect(titles(filterCamps(all, { query: "japan" }))).toEqual([
      "WordCamp Osaka",
    ]);
    expect(titles(filterCamps(all, { query: "palazzo" }))).toEqual([
      "WordCamp Rome",
    ]);
  });

  it("is case-insensitive", () => {
    expect(titles(filterCamps(all, { query: "ROME" }))).toEqual([
      "WordCamp Rome",
    ]);
  });

  it("trims surrounding whitespace from the query", () => {
    expect(titles(filterCamps(all, { query: "  osaka  " }))).toEqual([
      "WordCamp Osaka",
    ]);
  });

  it("can span fields in one query", () => {
    // "rome italy" appears only when title and country are joined.
    expect(titles(filterCamps(all, { query: "rome italy" }))).toEqual([
      "WordCamp Rome",
    ]);
  });

  it("requires every word to match, not just one", () => {
    // "rome" matches Rome but "tokyo" matches nothing about it — so token-AND
    // must exclude it, where token-OR would wrongly keep it.
    expect(filterCamps(all, { query: "rome tokyo" })).toEqual([]);
  });

  it("filters by region", () => {
    expect(titles(filterCamps(all, { region: "Asia" }))).toEqual([
      "WordCamp Osaka",
    ]);
  });

  it("treats an empty or All region as no constraint", () => {
    expect(filterCamps(all, { region: ALL_REGIONS })).toBe(all);
    expect(filterCamps(all, { region: "" })).toBe(all);
  });

  it("combines query and region", () => {
    const camps = [
      rome,
      osaka,
      camp({ id: 3, title: "WordCamp Kyoto", country: "Japan", continent: "Asia" }),
    ];

    // Region narrows to Asia, then the query narrows to Kyoto.
    expect(titles(filterCamps(camps, { query: "kyoto", region: "Asia" }))).toEqual(
      ["WordCamp Kyoto"],
    );
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterCamps(all, { query: "nairobi" })).toEqual([]);
  });

  it("preserves input order", () => {
    expect(titles(filterCamps(all, { query: "wordcamp" }))).toEqual([
      "WordCamp Rome",
      "WordCamp Osaka",
    ]);
  });

  it("returns an empty array for a non-array input", () => {
    expect(filterCamps(null, { query: "x" })).toEqual([]);
  });
});
