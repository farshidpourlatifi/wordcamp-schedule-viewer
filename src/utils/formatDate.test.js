import { formatCampDate, formatMonthLabel } from "@/utils/formatDate";

describe("formatCampDate", () => {
  it("formats a date as the design system specifies", () => {
    expect(formatCampDate(new Date("2026-03-14T00:00:00Z"))).toBe(
      "Sat, 14 Mar 2026",
    );
  });

  it("formats in UTC, so the displayed day matches the stored day", () => {
    // Local-time formatting would render this as 13 Mar for anyone west of
    // Greenwich — the card would disagree with the API for half the world.
    expect(formatCampDate(new Date("2026-03-14T00:00:00Z"))).toContain(
      "14 Mar",
    );
    expect(formatCampDate(new Date("2026-12-31T23:59:59Z"))).toBe(
      "Thu, 31 Dec 2026",
    );
  });

  it("renders the TBD label when there is no date", () => {
    expect(formatCampDate(null)).toBe("Date TBD");
    expect(formatCampDate(undefined)).toBe("Date TBD");
  });

  it("renders the TBD label rather than 'Invalid Date'", () => {
    expect(formatCampDate(new Date("nonsense"))).toBe("Date TBD");
    expect(formatCampDate("2026-03-14")).toBe("Date TBD");
  });
});

describe("formatMonthLabel", () => {
  it("formats a month heading", () => {
    expect(formatMonthLabel(new Date("2026-03-14T00:00:00Z"))).toBe(
      "March 2026",
    );
  });

  it("uses the UTC month at a month boundary", () => {
    expect(formatMonthLabel(new Date("2026-01-01T00:00:00Z"))).toBe(
      "January 2026",
    );
    expect(formatMonthLabel(new Date("2026-12-31T23:00:00Z"))).toBe(
      "December 2026",
    );
  });

  it("renders the TBD label when there is no date", () => {
    expect(formatMonthLabel(null)).toBe("Date TBD");
    expect(formatMonthLabel(new Date("nonsense"))).toBe("Date TBD");
  });
});
