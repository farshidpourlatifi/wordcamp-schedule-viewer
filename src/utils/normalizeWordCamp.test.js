import {
  normalizeWordCamp,
  normalizeWordCamps,
} from "@/utils/normalizeWordCamp";
import {
  upcomingRecord,
  datelessRecord,
  namedEntityTitleRecord,
  wordCampRecords,
} from "@/test/wordcamps.fixtures";

describe("normalizeWordCamp", () => {
  it("maps a full real record to the view model", () => {
    const camp = normalizeWordCamp(upcomingRecord);

    expect(camp).toEqual({
      id: 15221569,
      title: "WordPress Campus Connect Perpus Soetta Tegal",
      url: "https://events.wordpress.org/campusconnect/2026/perpus-soetta/",
      startDate: new Date("2026-08-09T00:00:00.000Z"),
      endDate: new Date("2026-08-09T00:00:00.000Z"),
      location: "Tegal Regency, Indonesia",
      venue:
        "Tegal Regency Public Library (Perpustakaan Soekarno-Hatta Kabupaten Tegal)",
    });
  });

  it("reads meta from the TOP level of the record, not from record.meta", () => {
    // The live API flattens these onto the record. Reading record.meta[...]
    // would yield undefined for every field and silently produce empty cards.
    const camp = normalizeWordCamp({
      id: 1,
      title: { rendered: "Camp" },
      "Start Date (YYYY-mm-dd)": "1786233600",
      Location: "Rome, Italy",
    });

    expect(camp.startDate).toEqual(new Date("2026-08-09T00:00:00.000Z"));
    expect(camp.location).toBe("Rome, Italy");
  });

  it("decodes entities in the title", () => {
    expect(normalizeWordCamp(namedEntityTitleRecord).title).toBe(
      "WordPress Campus Connect Pundra University of Science & Technology, Bogura",
    );
  });

  it("falls back to the central link when the event URL is absent", () => {
    const camp = normalizeWordCamp({
      id: 2,
      title: { rendered: "Camp" },
      link: "https://central.wordcamp.org/wordcamps/camp/",
      URL: "",
    });

    expect(camp.url).toBe("https://central.wordcamp.org/wordcamps/camp/");
  });

  it("prefers the event URL over the central link when both exist", () => {
    const camp = normalizeWordCamp({
      id: 3,
      title: { rendered: "Camp" },
      link: "https://central.wordcamp.org/wordcamps/camp/",
      URL: "https://camp.wordcamp.org/2026/",
    });

    expect(camp.url).toBe("https://camp.wordcamp.org/2026/");
  });

  it("defaults every optional field, treating empty strings as missing", () => {
    // Unset meta arrives as "" from this API, not null — so a plain
    // `?? fallback` would happily keep the empty string.
    const camp = normalizeWordCamp(datelessRecord);

    expect(camp.startDate).toBeNull();
    expect(camp.endDate).toBeNull();
    expect(camp.location).toBe("");
    expect(camp.venue).toBe("");
    expect(camp.url).toBe(datelessRecord.link);
  });

  it("survives a record with nothing but an id", () => {
    expect(normalizeWordCamp({ id: 9 })).toEqual({
      id: 9,
      title: "",
      url: "",
      startDate: null,
      endDate: null,
      location: "",
      venue: "",
    });
  });

  it("returns null for a record with no usable identity", () => {
    expect(normalizeWordCamp(null)).toBeNull();
    expect(normalizeWordCamp(undefined)).toBeNull();
    expect(normalizeWordCamp({})).toBeNull();
    expect(normalizeWordCamp("nonsense")).toBeNull();
  });
});

describe("normalizeWordCamps", () => {
  it("normalizes every fixture record", () => {
    const camps = normalizeWordCamps(wordCampRecords);

    expect(camps).toHaveLength(5);
    expect(camps.map((camp) => camp.id)).toEqual([
      15221569, 14841477, 13863070, 13861677, 12580471,
    ]);
  });

  it("drops unusable records instead of emitting holes", () => {
    const camps = normalizeWordCamps([
      upcomingRecord,
      null,
      {},
      { id: 7, title: { rendered: "Kept" } },
    ]);

    expect(camps).toHaveLength(2);
    expect(camps[1].title).toBe("Kept");
  });

  it("returns an empty array for a non-array argument", () => {
    expect(normalizeWordCamps(null)).toEqual([]);
    expect(normalizeWordCamps(undefined)).toEqual([]);
    expect(normalizeWordCamps({})).toEqual([]);
  });
});
