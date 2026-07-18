import { partitionByDate } from "@/utils/partitionByDate";

/** Fixed clock — every assertion below is relative to this instant. */
const NOW = new Date("2026-07-18T12:00:00.000Z");

/** Minimal camp shape; only id and startDate matter to partitioning. */
const camp = (id, iso) => ({
  id,
  title: `Camp ${id}`,
  startDate: iso === null ? null : new Date(iso),
});

describe("partitionByDate", () => {
  it("splits camps around the injected now", () => {
    const { upcoming, past } = partitionByDate(
      [
        camp("future", "2026-09-01T00:00:00Z"),
        camp("history", "2026-01-15T00:00:00Z"),
      ],
      NOW,
    );

    expect(upcoming.map((c) => c.id)).toEqual(["future"]);
    expect(past.map((c) => c.id)).toEqual(["history"]);
  });

  it("counts a camp happening TODAY as upcoming, not past", () => {
    // These are day-precision events. A camp that starts at 00:00 today is
    // still on today, even though its timestamp is behind a midday `now` —
    // a naive `startDate >= now` comparison would file it under Past while
    // attendees are literally there.
    const { upcoming, past } = partitionByDate(
      [camp("today", "2026-07-18T00:00:00Z")],
      NOW,
    );

    expect(upcoming.map((c) => c.id)).toEqual(["today"]);
    expect(past).toEqual([]);
  });

  it("counts yesterday as past and tomorrow as upcoming", () => {
    const { upcoming, past } = partitionByDate(
      [
        camp("yesterday", "2026-07-17T23:59:59Z"),
        camp("tomorrow", "2026-07-19T00:00:00Z"),
      ],
      NOW,
    );

    expect(upcoming.map((c) => c.id)).toEqual(["tomorrow"]);
    expect(past.map((c) => c.id)).toEqual(["yesterday"]);
  });

  it("sorts upcoming soonest-first", () => {
    const { upcoming } = partitionByDate(
      [
        camp("c", "2026-12-01T00:00:00Z"),
        camp("a", "2026-08-01T00:00:00Z"),
        camp("b", "2026-10-01T00:00:00Z"),
      ],
      NOW,
    );

    expect(upcoming.map((c) => c.id)).toEqual(["a", "b", "c"]);
  });

  it("sorts past most-recent-first", () => {
    // Opposite order from upcoming, and deliberately so: both lists lead with
    // the camps nearest to today, which is what a reader is looking for.
    const { past } = partitionByDate(
      [
        camp("older", "2025-01-01T00:00:00Z"),
        camp("newest", "2026-06-01T00:00:00Z"),
        camp("middle", "2025-09-01T00:00:00Z"),
      ],
      NOW,
    );

    expect(past.map((c) => c.id)).toEqual(["newest", "middle", "older"]);
  });

  it("files dateless camps under past, after every dated one", () => {
    // A camp with no date cannot be scheduled-and-announced, so it is history
    // or noise; either way it must not push a real upcoming camp down the
    // page. Ordering them last keeps the list deterministic.
    const { upcoming, past } = partitionByDate(
      [
        camp("nodate-a", null),
        camp("dated", "2026-06-01T00:00:00Z"),
        camp("nodate-b", null),
      ],
      NOW,
    );

    expect(upcoming).toEqual([]);
    expect(past.map((c) => c.id)).toEqual(["dated", "nodate-a", "nodate-b"]);
  });

  it("preserves input order among equally-dated camps", () => {
    // A stable sort keeps the API's own ordering as the tiebreak, so the list
    // does not reshuffle between renders.
    const { upcoming } = partitionByDate(
      [
        camp("first", "2026-08-01T00:00:00Z"),
        camp("second", "2026-08-01T00:00:00Z"),
        camp("third", "2026-08-01T00:00:00Z"),
      ],
      NOW,
    );

    expect(upcoming.map((c) => c.id)).toEqual(["first", "second", "third"]);
  });

  it("does not mutate the input array", () => {
    const input = [
      camp("b", "2026-09-01T00:00:00Z"),
      camp("a", "2026-08-01T00:00:00Z"),
    ];
    const original = [...input];

    partitionByDate(input, NOW);

    expect(input).toEqual(original);
  });

  it("returns two empty lists for empty or invalid input", () => {
    expect(partitionByDate([], NOW)).toEqual({ upcoming: [], past: [] });
    expect(partitionByDate(null, NOW)).toEqual({ upcoming: [], past: [] });
    expect(partitionByDate(undefined, NOW)).toEqual({ upcoming: [], past: [] });
  });

  it("defaults to the real clock when now is omitted", () => {
    // Injectable, not hardcoded — but with a sane default so callers in the
    // app do not have to thread a clock through every layer.
    const { upcoming, past } = partitionByDate([
      camp("long-ago", "2001-01-01T00:00:00Z"),
      camp("far-off", "2099-01-01T00:00:00Z"),
    ]);

    expect(upcoming.map((c) => c.id)).toEqual(["far-off"]);
    expect(past.map((c) => c.id)).toEqual(["long-ago"]);
  });
});
