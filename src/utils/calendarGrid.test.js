import {
  WEEKDAYS,
  DAYS_PER_WEEK,
  WEEKS_PER_GRID,
  MAX_SPAN_DAYS,
  startOfUtcMonth,
  addUtcMonths,
  toDayKey,
  buildMonthGrid,
  indexCampsByDay,
  monthBounds,
} from "@/utils/calendarGrid";

const utc = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

/** A normalized camp, only the fields the grid math reads. */
const camp = (id, start, end = null) => ({
  id,
  startDate: start,
  endDate: end,
});

describe("startOfUtcMonth", () => {
  it("returns the first of the containing month", () => {
    expect(startOfUtcMonth(utc(2026, 3, 14))).toEqual(utc(2026, 3, 1));
  });

  it("is idempotent on a date already at the start", () => {
    expect(startOfUtcMonth(utc(2026, 3, 1))).toEqual(utc(2026, 3, 1));
  });

  it("uses UTC, not the local zone", () => {
    // Late-UTC-evening on the 1st is still the 1st in UTC, but would be the
    // last day of February anywhere west of Greenwich.
    const lateOnTheFirst = new Date("2026-03-01T23:30:00Z");

    expect(startOfUtcMonth(lateOnTheFirst)).toEqual(utc(2026, 3, 1));
  });
});

describe("addUtcMonths", () => {
  it("moves forward within a year", () => {
    expect(addUtcMonths(utc(2026, 3, 1), 2)).toEqual(utc(2026, 5, 1));
  });

  it("moves backward within a year", () => {
    expect(addUtcMonths(utc(2026, 3, 1), -2)).toEqual(utc(2026, 1, 1));
  });

  it("rolls over into the next year", () => {
    expect(addUtcMonths(utc(2026, 12, 1), 1)).toEqual(utc(2027, 1, 1));
  });

  it("rolls back into the previous year", () => {
    expect(addUtcMonths(utc(2026, 1, 1), -1)).toEqual(utc(2025, 12, 1));
  });

  it("handles a delta larger than a year", () => {
    expect(addUtcMonths(utc(2026, 6, 1), 14)).toEqual(utc(2027, 8, 1));
  });

  it("returns a new Date rather than mutating its input", () => {
    const start = utc(2026, 3, 1);

    addUtcMonths(start, 5);

    expect(start).toEqual(utc(2026, 3, 1));
  });
});

describe("toDayKey", () => {
  it("zero-pads month and day so keys sort lexicographically", () => {
    expect(toDayKey(utc(2026, 3, 4))).toBe("2026-03-04");
  });

  it("sorts chronologically as plain strings", () => {
    const keys = [utc(2026, 12, 1), utc(2026, 2, 10), utc(2026, 2, 2)].map(
      toDayKey,
    );

    expect([...keys].sort()).toEqual(["2026-02-02", "2026-02-10", "2026-12-01"]);
  });
});

describe("buildMonthGrid", () => {
  it("always returns six rows of seven days", () => {
    const grid = buildMonthGrid(utc(2026, 3, 1));

    expect(grid).toHaveLength(WEEKS_PER_GRID);
    grid.forEach((week) => expect(week).toHaveLength(DAYS_PER_WEEK));
  });

  it("starts every row on a Monday", () => {
    const grid = buildMonthGrid(utc(2026, 3, 1));

    // 1 is Monday in getUTCDay's Sunday-based numbering.
    grid.forEach((week) => expect(week[0].getUTCDay()).toBe(1));
  });

  it("pads with the previous month when the 1st is not a Monday", () => {
    // 1 March 2026 is a Sunday, so a Monday-first grid needs six leading days.
    const grid = buildMonthGrid(utc(2026, 3, 1));

    expect(grid[0][0]).toEqual(utc(2026, 2, 23));
    expect(grid[0][6]).toEqual(utc(2026, 3, 1));
  });

  it("needs no padding when the 1st is already a Monday", () => {
    // 1 June 2026 is a Monday.
    const grid = buildMonthGrid(utc(2026, 6, 1));

    expect(grid[0][0]).toEqual(utc(2026, 6, 1));
  });

  it("runs into the following month to fill the last row", () => {
    const grid = buildMonthGrid(utc(2026, 6, 1));
    const lastCell = grid[WEEKS_PER_GRID - 1][DAYS_PER_WEEK - 1];

    // June 2026 starts on a Monday, so 42 cells reach well into July.
    expect(lastCell).toEqual(utc(2026, 7, 12));
  });

  it("covers every day of a 31-day month", () => {
    const days = buildMonthGrid(utc(2026, 1, 1))
      .flat()
      .filter((date) => date.getUTCMonth() === 0);

    expect(days).toHaveLength(31);
  });

  it("covers February in a non-leap year", () => {
    const days = buildMonthGrid(utc(2026, 2, 1))
      .flat()
      .filter((date) => date.getUTCMonth() === 1);

    expect(days).toHaveLength(28);
  });

  it("covers February in a leap year", () => {
    const days = buildMonthGrid(utc(2024, 2, 1))
      .flat()
      .filter((date) => date.getUTCMonth() === 1);

    expect(days).toHaveLength(29);
  });

  it("produces consecutive days with no gaps or repeats", () => {
    const keys = buildMonthGrid(utc(2026, 3, 1)).flat().map(toDayKey);

    expect(new Set(keys).size).toBe(WEEKS_PER_GRID * DAYS_PER_WEEK);
    expect([...keys].sort()).toEqual(keys);
  });

  it("crosses a year boundary correctly", () => {
    const grid = buildMonthGrid(utc(2026, 12, 1));
    const januaryDays = grid.flat().filter((date) => date.getUTCFullYear() === 2027);

    expect(januaryDays.length).toBeGreaterThan(0);
  });
});

describe("indexCampsByDay", () => {
  it("indexes a single-day camp under its start day", () => {
    const rome = camp(1, utc(2026, 3, 14));

    const index = indexCampsByDay([rome]);

    expect(index.get("2026-03-14")).toEqual([{ camp: rome, isStart: true }]);
  });

  it("expands a multi-day camp across every day it spans", () => {
    const europe = camp(1, utc(2026, 6, 4), utc(2026, 6, 6));

    const index = indexCampsByDay([europe]);

    expect(index.get("2026-06-04")).toEqual([{ camp: europe, isStart: true }]);
    expect(index.get("2026-06-05")).toEqual([{ camp: europe, isStart: false }]);
    expect(index.get("2026-06-06")).toEqual([{ camp: europe, isStart: false }]);
    expect(index.has("2026-06-07")).toBe(false);
  });

  it("marks exactly one day as the start, so only one day links", () => {
    const index = indexCampsByDay([camp(1, utc(2026, 6, 4), utc(2026, 6, 6))]);

    const starts = [...index.values()]
      .flat()
      .filter((entry) => entry.isStart);

    expect(starts).toHaveLength(1);
  });

  it("collects several camps sharing a day", () => {
    const first = camp(1, utc(2026, 8, 1));
    const second = camp(2, utc(2026, 8, 1));

    const index = indexCampsByDay([first, second]);

    expect(index.get("2026-08-01")).toEqual([
      { camp: first, isStart: true },
      { camp: second, isStart: true },
    ]);
  });

  it("caps an implausibly long span rather than inflating the index", () => {
    // A malformed record: end date a decade after the start.
    const malformed = camp(1, utc(2026, 3, 1), utc(2036, 3, 1));

    const index = indexCampsByDay([malformed]);

    expect(index.size).toBe(MAX_SPAN_DAYS);
  });

  it("treats a backwards end date as a single day", () => {
    const index = indexCampsByDay([camp(1, utc(2026, 3, 14), utc(2026, 3, 1))]);

    expect(index.size).toBe(1);
    expect(index.has("2026-03-14")).toBe(true);
  });

  it("treats an invalid end date as a single day", () => {
    const index = indexCampsByDay([
      camp(1, utc(2026, 3, 14), new Date("nonsense")),
    ]);

    expect(index.size).toBe(1);
  });

  it("spans across a month boundary", () => {
    const index = indexCampsByDay([camp(1, utc(2026, 3, 31), utc(2026, 4, 1))]);

    expect(index.has("2026-03-31")).toBe(true);
    expect(index.has("2026-04-01")).toBe(true);
  });

  it("skips dateless camps, which have no cell to occupy", () => {
    expect(indexCampsByDay([camp(1, null)]).size).toBe(0);
  });

  it("skips camps whose start date is invalid", () => {
    expect(indexCampsByDay([camp(1, new Date("nonsense"))]).size).toBe(0);
  });

  it("tolerates holes in the list", () => {
    expect(indexCampsByDay([null, undefined, camp(1, utc(2026, 3, 14))]).size).toBe(1);
  });

  it("returns an empty index for a non-array", () => {
    expect(indexCampsByDay(undefined).size).toBe(0);
  });
});

describe("monthBounds", () => {
  it("finds the earliest and latest month", () => {
    const bounds = monthBounds([
      camp(1, utc(2026, 6, 10)),
      camp(2, utc(2024, 2, 20)),
      camp(3, utc(2027, 1, 5)),
    ]);

    expect(bounds.first).toEqual(utc(2024, 2, 1));
    expect(bounds.last).toEqual(utc(2027, 1, 1));
  });

  it("collapses to one month when every camp shares it", () => {
    const bounds = monthBounds([
      camp(1, utc(2026, 6, 2)),
      camp(2, utc(2026, 6, 28)),
    ]);

    expect(bounds.first).toEqual(utc(2026, 6, 1));
    expect(bounds.last).toEqual(utc(2026, 6, 1));
  });

  it("ignores dateless camps", () => {
    const bounds = monthBounds([camp(1, null), camp(2, utc(2026, 6, 10))]);

    expect(bounds.first).toEqual(utc(2026, 6, 1));
    expect(bounds.last).toEqual(utc(2026, 6, 1));
  });

  it("returns nulls when no camp has a usable date", () => {
    expect(monthBounds([camp(1, null)])).toEqual({ first: null, last: null });
  });

  it("returns nulls for an empty list", () => {
    expect(monthBounds([])).toEqual({ first: null, last: null });
  });

  it("returns nulls for a non-array", () => {
    expect(monthBounds(null)).toEqual({ first: null, last: null });
  });
});

describe("WEEKDAYS", () => {
  it("covers a full week starting on Monday", () => {
    expect(WEEKDAYS).toHaveLength(DAYS_PER_WEEK);
    expect(WEEKDAYS[0].long).toBe("Monday");
    expect(WEEKDAYS[DAYS_PER_WEEK - 1].long).toBe("Sunday");
  });
});
