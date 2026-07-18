import { parseWordCampDate } from "@/utils/parseDate";
import { upcomingRecord, datelessRecord } from "@/test/wordcamps.fixtures";

describe("parseWordCampDate", () => {
  it("parses a Unix-seconds string, the format the API actually sends", () => {
    // The meta key is "Start Date (YYYY-mm-dd)" but the value is seconds as a
    // string. Trusting the key name would parse this as NaN.
    const parsed = parseWordCampDate("1786233600");

    expect(parsed).toBeInstanceOf(Date);
    expect(parsed.toISOString()).toBe("2026-08-09T00:00:00.000Z");
  });

  it("parses Unix seconds given as a number", () => {
    expect(parseWordCampDate(1786233600).toISOString()).toBe(
      "2026-08-09T00:00:00.000Z",
    );
  });

  it("parses an ISO date string, in case the meta schema changes again", () => {
    expect(parseWordCampDate("2026-08-06").toISOString()).toBe(
      "2026-08-06T00:00:00.000Z",
    );
    expect(parseWordCampDate("2026-08-06T12:30:00Z").toISOString()).toBe(
      "2026-08-06T12:30:00.000Z",
    );
  });

  it("returns null for every shape of 'no date'", () => {
    // "" is what the live API returns for unset meta; 0 and "0" are what
    // WordPress stores for a cleared timestamp.
    expect(parseWordCampDate("")).toBeNull();
    expect(parseWordCampDate(null)).toBeNull();
    expect(parseWordCampDate(undefined)).toBeNull();
    expect(parseWordCampDate(0)).toBeNull();
    expect(parseWordCampDate("0")).toBeNull();
  });

  it("returns null for garbage rather than an Invalid Date", () => {
    // An Invalid Date is truthy and instanceof Date, so it would sail through
    // a null check and only fail later at format time.
    expect(parseWordCampDate("not a date")).toBeNull();
    expect(parseWordCampDate("2026-13-45")).toBeNull();
    expect(parseWordCampDate({})).toBeNull();
    expect(parseWordCampDate([])).toBeNull();
    expect(parseWordCampDate(NaN)).toBeNull();
  });

  it("rejects a timestamp beyond the range JavaScript can represent", () => {
    // Seconds this large overflow past the max Date (±8.64e15 ms), which
    // yields an Invalid Date rather than throwing.
    expect(parseWordCampDate("99999999999999999")).toBeNull();
    expect(parseWordCampDate(1e17)).toBeNull();
  });

  it("rejects a negative timestamp", () => {
    // No WordCamp predates the Unix epoch; a negative value is corrupt data.
    expect(parseWordCampDate("-1786233600")).toBeNull();
  });

  it("parses the real fixture records", () => {
    expect(
      parseWordCampDate(upcomingRecord["Start Date (YYYY-mm-dd)"]),
    ).toBeInstanceOf(Date);
    expect(
      parseWordCampDate(datelessRecord["Start Date (YYYY-mm-dd)"]),
    ).toBeNull();
  });
});
