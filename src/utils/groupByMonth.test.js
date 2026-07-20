import { groupByMonth } from "@/utils/groupByMonth";

const camp = (id, iso) => ({
  id,
  title: `Camp ${id}`,
  startDate: iso === null ? null : new Date(iso),
});

describe("groupByMonth", () => {
  it("groups camps into month sections", () => {
    const groups = groupByMonth([
      camp("a", "2026-03-14T00:00:00Z"),
      camp("b", "2026-03-28T00:00:00Z"),
      camp("c", "2026-04-02T00:00:00Z"),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].key).toBe("2026-03");
    expect(groups[0].label).toBe("March 2026");
    expect(groups[0].camps.map((c) => c.id)).toEqual(["a", "b"]);
    expect(groups[1].key).toBe("2026-04");
    expect(groups[1].label).toBe("April 2026");
    expect(groups[1].camps.map((c) => c.id)).toEqual(["c"]);
  });

  it("preserves the order the camps arrive in", () => {
    // Ordering is partitionByDate's job — upcoming ascending, past
    // descending. Re-sorting here would silently override it and put Past
    // months back in ascending order.
    const groups = groupByMonth([
      camp("newest", "2026-06-01T00:00:00Z"),
      camp("older", "2026-02-01T00:00:00Z"),
    ]);

    expect(groups.map((g) => g.key)).toEqual(["2026-06", "2026-02"]);
  });

  it("keeps same-numbered months in different years apart", () => {
    // Keying on month alone would fuse March 2025 and March 2026 into one
    // section — the bug a bare getMonth() key would produce.
    const groups = groupByMonth([
      camp("this-year", "2026-03-01T00:00:00Z"),
      camp("last-year", "2025-03-01T00:00:00Z"),
    ]);

    expect(groups.map((g) => g.key)).toEqual(["2026-03", "2025-03"]);
    expect(groups.map((g) => g.label)).toEqual(["March 2026", "March 2025"]);
  });

  it("zero-pads the month in the key so keys sort lexicographically", () => {
    const groups = groupByMonth([camp("a", "2026-01-05T00:00:00Z")]);

    expect(groups[0].key).toBe("2026-01");
  });

  it("reopens a month section rather than merging non-adjacent camps", () => {
    // Grouping follows input order, so a month that appears twice yields two
    // sections. That keeps the rendered order faithful to the sorted input
    // instead of teleporting a camp into an earlier section.
    const groups = groupByMonth([
      camp("a", "2026-03-01T00:00:00Z"),
      camp("b", "2026-04-01T00:00:00Z"),
      camp("c", "2026-03-15T00:00:00Z"),
    ]);

    expect(groups.map((g) => g.key)).toEqual(["2026-03", "2026-04", "2026-03"]);
    expect(groups[2].camps.map((c) => c.id)).toEqual(["c"]);
  });

  it("collects dateless camps into a single TBD section at the end", () => {
    const groups = groupByMonth([
      camp("nodate-a", null),
      camp("dated", "2026-03-01T00:00:00Z"),
      camp("nodate-b", null),
    ]);

    expect(groups.map((g) => g.key)).toEqual(["2026-03", "tbd"]);
    expect(groups[1].label).toBe("Date TBD");
    expect(groups[1].camps.map((c) => c.id)).toEqual(["nodate-a", "nodate-b"]);
  });

  it("omits the TBD section entirely when every camp has a date", () => {
    const groups = groupByMonth([camp("a", "2026-03-01T00:00:00Z")]);

    expect(groups.map((g) => g.key)).toEqual(["2026-03"]);
  });

  it("returns an empty array for empty or invalid input", () => {
    expect(groupByMonth([])).toEqual([]);
    expect(groupByMonth(null)).toEqual([]);
    expect(groupByMonth(undefined)).toEqual([]);
  });

  it("tolerates holes in the list", () => {
    // A null element has no date, so it belongs in the TBD bucket rather than
    // throwing when `camp?.startDate` is read.
    const groups = groupByMonth([null, camp("a", "2026-03-14T00:00:00Z")]);

    expect(groups.find((g) => g.key === "2026-03")).toBeDefined();
    expect(groups.find((g) => g.key === "tbd")).toBeDefined();
  });
});
