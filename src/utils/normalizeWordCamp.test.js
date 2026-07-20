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
      coordinates: null,
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

  describe("url sanitization", () => {
    // These values become an <a href>, which is an executable sink. The API is
    // trusted today, but "trusted source" is not a security control.
    const withUrl = (url) => normalizeWordCamp({ id: 1, URL: url }).url;

    it("rejects javascript: URLs", () => {
      expect(withUrl("javascript:alert(1)")).toBe("");
      // The URL parser lowercases the scheme and strips embedded whitespace,
      // so these obfuscations collapse to the same rejected protocol.
      expect(withUrl("JavaScript:alert(1)")).toBe("");
      expect(withUrl("java\nscript:alert(1)")).toBe("");
      expect(withUrl("\tjavascript:alert(1)")).toBe("");
    });

    it("rejects data: URLs", () => {
      expect(withUrl("data:text/html,<script>alert(1)</script>")).toBe("");
      expect(withUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe("");
    });

    it("rejects other non-http schemes", () => {
      expect(withUrl("vbscript:msgbox(1)")).toBe("");
      expect(withUrl("file:///etc/passwd")).toBe("");
      expect(withUrl("ftp://example.com/x")).toBe("");
    });

    it("rejects a value that is not an absolute URL", () => {
      expect(withUrl("/wordcamps/rome")).toBe("");
      expect(withUrl("not a url")).toBe("");
    });

    it("accepts http and https", () => {
      expect(withUrl("https://rome.wordcamp.org/2026/")).toBe(
        "https://rome.wordcamp.org/2026/",
      );
      expect(withUrl("http://rome.wordcamp.org/2026/")).toBe(
        "http://rome.wordcamp.org/2026/",
      );
    });

    it("falls back to the central link when the event URL is unsafe", () => {
      const camp = normalizeWordCamp({
        id: 1,
        URL: "javascript:alert(1)",
        link: "https://central.wordcamp.org/wordcamps/camp/",
      });

      expect(camp.url).toBe("https://central.wordcamp.org/wordcamps/camp/");
    });

    it("sanitizes the fallback link too", () => {
      // Both fields come from the same feed; validating only one leaves the
      // other as an open path to the sink.
      expect(
        normalizeWordCamp({ id: 1, URL: "", link: "javascript:alert(1)" }).url,
      ).toBe("");
    });
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
      coordinates: null,
    });
  });

  describe("coordinates", () => {
    const withVenue = (coords) =>
      normalizeWordCamp({ id: 1, _venue_coordinates: coords }).coordinates;

    it("reads a valid venue coordinate pair", () => {
      // The live shape: { latitude, longitude }, mapped to { lat, lng }.
      expect(withVenue({ latitude: 27.7081128, longitude: 85.3214557 })).toEqual(
        { lat: 27.7081128, lng: 85.3214557 },
      );
    });

    it("coerces numeric strings", () => {
      expect(withVenue({ latitude: "51.5", longitude: "-0.12" })).toEqual({
        lat: 51.5,
        lng: -0.12,
      });
    });

    it("is null when the field is the API's empty-string default", () => {
      // Virtual and unlocated events send "" here rather than an object.
      expect(withVenue("")).toBeNull();
    });

    it("is null when the field is absent entirely", () => {
      expect(normalizeWordCamp({ id: 1 }).coordinates).toBeNull();
    });

    it("is null — not a throw — when the field is null", () => {
      // typeof null === "object", so the truthiness guard, not the type check,
      // is what stops `null.latitude` from throwing.
      expect(withVenue(null)).toBeNull();
    });

    it("rejects a pair that is not finite", () => {
      expect(withVenue({ latitude: "north", longitude: 5 })).toBeNull();
    });

    it("rejects a pair out of geographic range", () => {
      // A bad record must not put a marker at an impossible point or throw
      // inside Leaflet.
      expect(withVenue({ latitude: 91, longitude: 0 })).toBeNull();
      expect(withVenue({ latitude: 0, longitude: 181 })).toBeNull();
    });

    it("accepts the exact range boundaries", () => {
      expect(withVenue({ latitude: 90, longitude: -180 })).toEqual({
        lat: 90,
        lng: -180,
      });
    });
  });

  it("returns null for a record with no usable identity", () => {
    expect(normalizeWordCamp(null)).toBeNull();
    expect(normalizeWordCamp(undefined)).toBeNull();
    expect(normalizeWordCamp({})).toBeNull();
    expect(normalizeWordCamp("nonsense")).toBeNull();
  });

  it("keeps a record whose id is 0", () => {
    // 0 is a valid id and falsy; the guard tests `=== undefined`, so a
    // truthiness check here would wrongly discard it.
    expect(normalizeWordCamp({ id: 0 })).not.toBeNull();
  });

  it("trims whitespace around meta values", () => {
    // WordPress meta arrives padded often enough to matter; without the trim
    // the location would render with its surrounding spaces intact.
    const camp = normalizeWordCamp({
      id: 1,
      Location: "  Rome, Italy  ",
      "Venue Name": "  The Venue  ",
    });

    expect(camp.location).toBe("Rome, Italy");
    expect(camp.venue).toBe("The Venue");
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
