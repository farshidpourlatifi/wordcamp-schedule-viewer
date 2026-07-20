import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MonthCalendar } from "@/components/MonthCalendar";
import { DAYS_PER_WEEK, WEEKS_PER_GRID } from "@/utils/calendarGrid";

const utc = (year, month, day) => new Date(Date.UTC(year, month - 1, day));

/** A fixed "today" so the current-date assertions cannot rot. */
const NOW = utc(2026, 3, 10);

const camp = (overrides = {}) => ({
  id: 1,
  title: "WordCamp Rome",
  url: "https://rome.wordcamp.org/2026/",
  startDate: utc(2026, 3, 14),
  endDate: null,
  location: "Rome, Italy",
  venue: "",
  ...overrides,
});

const renderCalendar = (props) =>
  render(
    <MonthCalendar
      camps={[camp()]}
      emptyMessage="Nothing here."
      now={NOW}
      {...props}
    />,
  );

/** The <td> containing a given day number, within the current month. */
const cellFor = (dayNumber) => {
  const cells = screen.getAllByRole("cell");

  return cells.find(
    (cell) => within(cell).queryByText(String(dayNumber)) !== null,
  );
};

describe("MonthCalendar", () => {
  it("shows the empty message when there are no camps", () => {
    renderCalendar({ camps: [] });

    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("opens on today's month when the data reaches it", () => {
    renderCalendar({
      camps: [
        camp({ id: 1, startDate: utc(2026, 1, 5) }),
        camp({ id: 2, startDate: utc(2026, 6, 4) }),
      ],
    });

    // NOW is 10 March 2026, between the two camps: the calendar opens where
    // the reader already is, not on the first camp months earlier.
    expect(
      screen.getByRole("heading", { level: 2, name: "March 2026" }),
    ).toBeInTheDocument();
  });

  it("clamps forward when the data starts after today", () => {
    renderCalendar({ camps: [camp({ startDate: utc(2026, 6, 4) })] });

    expect(
      screen.getByRole("heading", { level: 2, name: "June 2026" }),
    ).toBeInTheDocument();
  });

  it("clamps back when the data ends before today", () => {
    renderCalendar({ camps: [camp({ startDate: utc(2024, 9, 7) })] });

    expect(
      screen.getByRole("heading", { level: 2, name: "September 2024" }),
    ).toBeInTheDocument();
  });

  it("falls back to the current month when no camp has a date", () => {
    renderCalendar({ camps: [camp({ startDate: null })] });

    expect(
      screen.getByRole("heading", { level: 2, name: "March 2026" }),
    ).toBeInTheDocument();
  });

  it("falls back to the real clock when none is injected", () => {
    // Asserts only what is clock-independent: the month still comes from the
    // camp, so this cannot rot the way an assertion about "today" would.
    render(<MonthCalendar camps={[camp()]} emptyMessage="Nothing here." />);

    expect(
      screen.getByRole("heading", { level: 2, name: "March 2026" }),
    ).toBeInTheDocument();
  });

  it("labels the table with the month on show", () => {
    renderCalendar();

    expect(
      screen.getByRole("table", { name: "WordCamps in March 2026" }),
    ).toBeInTheDocument();
  });

  it("renders a Monday-first week of column headers", () => {
    renderCalendar();

    const headers = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent);

    expect(headers).toHaveLength(DAYS_PER_WEEK);
    expect(headers[0]).toContain("Monday");
    expect(headers[DAYS_PER_WEEK - 1]).toContain("Sunday");
  });

  it("renders a fixed six-week grid so the height never jumps", () => {
    renderCalendar();

    // +1 for the header row.
    expect(screen.getAllByRole("row")).toHaveLength(WEEKS_PER_GRID + 1);
  });

  it("places a camp in its own day cell", () => {
    renderCalendar();

    expect(
      within(cellFor(14)).getByRole("link", { name: "WordCamp Rome" }),
    ).toBeInTheDocument();
  });

  it("links a camp to its site, safely", () => {
    renderCalendar();

    const link = screen.getByRole("link", { name: "WordCamp Rome" });

    expect(link).toHaveAttribute("href", "https://rome.wordcamp.org/2026/");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders a camp with no safe URL as plain text", () => {
    renderCalendar({ camps: [camp({ url: "" })] });

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("WordCamp Rome")).toBeInTheDocument();
  });

  it("marks today for assistive technology", () => {
    renderCalendar();

    expect(cellFor(10)).toHaveAttribute("aria-current", "date");
    expect(cellFor(14)).not.toHaveAttribute("aria-current");
  });

  it("names today in the cell, not by colour alone", () => {
    renderCalendar();

    expect(within(cellFor(10)).getByText(/\(today\)/)).toBeInTheDocument();
  });

  describe("the Today control", () => {
    const spread = [
      camp({ id: 1, startDate: utc(2026, 1, 5) }),
      camp({ id: 2, startDate: utc(2026, 6, 4) }),
    ];

    it("says which day it means", () => {
      renderCalendar({ camps: spread });

      expect(
        screen.getByRole("button", { name: "Go to today, Tue, 10 Mar 2026" }),
      ).toBeInTheDocument();
    });

    it("is idle while today is already on screen", () => {
      renderCalendar({ camps: spread });

      expect(screen.getByRole("button", { name: /Go to today/ })).toBeDisabled();
    });

    it("returns to today's month after navigating away", async () => {
      const user = userEvent.setup();
      renderCalendar({ camps: spread });

      await user.click(screen.getByRole("button", { name: "Next month" }));
      await user.click(screen.getByRole("button", { name: "Next month" }));
      expect(
        screen.getByRole("heading", { level: 2, name: "May 2026" }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /Go to today/ }));

      expect(
        screen.getByRole("heading", { level: 2, name: "March 2026" }),
      ).toBeInTheDocument();
    });

    it("stays idle when the data never reaches today", () => {
      // Every camp is years past; jumping to today would leave the data.
      renderCalendar({ camps: [camp({ startDate: utc(2024, 9, 7) })] });

      expect(screen.getByRole("button", { name: /Go to today/ })).toBeDisabled();
    });
  });

  describe("multi-day camps", () => {
    const threeDay = camp({
      startDate: utc(2026, 3, 4),
      endDate: utc(2026, 3, 6),
    });

    it("appears on every day it spans", () => {
      renderCalendar({ camps: [threeDay] });

      [4, 5, 6].forEach((day) => {
        expect(within(cellFor(day)).getByText(/WordCamp Rome/)).toBeInTheDocument();
      });
    });

    it("links only once, so it costs a single tab stop", () => {
      renderCalendar({ camps: [threeDay] });

      expect(screen.getAllByRole("link", { name: "WordCamp Rome" })).toHaveLength(1);
    });

    it("announces continuation days as such", () => {
      renderCalendar({ camps: [threeDay] });

      expect(within(cellFor(5)).getByText("Continues:")).toBeInTheDocument();
      expect(within(cellFor(4)).queryByText("Continues:")).not.toBeInTheDocument();
    });
  });

  describe("long-running programmes", () => {
    // Real shape from the live feed: Campus Connect entries run for months,
    // and 16% of dated records span 15+ days.
    const programme = camp({
      title: "WordPress Campus Connect Surat",
      startDate: utc(2026, 3, 2),
      endDate: utc(2026, 5, 31),
    });

    it("sits on its start day only, instead of carpeting the grid", () => {
      renderCalendar({ camps: [programme], now: utc(2026, 3, 10) });

      expect(
        within(cellFor(2)).getByText(/WordPress Campus Connect Surat/),
      ).toBeInTheDocument();
      expect(within(cellFor(9)).queryByText(/Campus Connect/)).not.toBeInTheDocument();
    });

    it("says how long it runs, since the grid no longer shows it", () => {
      renderCalendar({ camps: [programme], now: utc(2026, 3, 10) });

      expect(
        screen.getByRole("link", {
          name: /WordPress Campus Connect Surat.*runs until Sun, 31 May 2026/,
        }),
      ).toBeInTheDocument();
    });

    it("leaves a conference-length camp expanded", () => {
      renderCalendar({
        camps: [camp({ startDate: utc(2026, 3, 4), endDate: utc(2026, 3, 6) })],
        now: utc(2026, 3, 10),
      });

      expect(within(cellFor(5)).getByText(/WordCamp Rome/)).toBeInTheDocument();
      expect(screen.queryByText(/runs until/)).not.toBeInTheDocument();
    });
  });

  describe("month navigation", () => {
    const across = [
      camp({ id: 1, startDate: utc(2026, 3, 14) }),
      camp({ id: 2, title: "WordCamp Oslo", startDate: utc(2026, 5, 9) }),
    ];

    it("moves to the next month", async () => {
      const user = userEvent.setup();
      renderCalendar({ camps: across });

      await user.click(screen.getByRole("button", { name: "Next month" }));

      expect(
        screen.getByRole("heading", { level: 2, name: "April 2026" }),
      ).toBeInTheDocument();
    });

    it("moves back to the previous month", async () => {
      const user = userEvent.setup();
      renderCalendar({ camps: across });

      await user.click(screen.getByRole("button", { name: "Next month" }));
      await user.click(screen.getByRole("button", { name: "Previous month" }));

      expect(
        screen.getByRole("heading", { level: 2, name: "March 2026" }),
      ).toBeInTheDocument();
    });

    it("reveals the camps of the month it lands on", async () => {
      const user = userEvent.setup();
      renderCalendar({ camps: across });

      expect(screen.queryByText("WordCamp Oslo")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Next month" }));
      await user.click(screen.getByRole("button", { name: "Next month" }));

      expect(screen.getByText("WordCamp Oslo")).toBeInTheDocument();
    });

    it("clamps at the earliest month holding camps", () => {
      renderCalendar({ camps: across });

      expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    });

    it("clamps at the latest month holding camps", async () => {
      const user = userEvent.setup();
      renderCalendar({ camps: across });

      await user.click(screen.getByRole("button", { name: "Next month" }));
      await user.click(screen.getByRole("button", { name: "Next month" }));

      expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    });

    it("disables both directions when every camp is in one month", () => {
      renderCalendar();

      expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    });
  });

  describe("dateless camps", () => {
    it("reports them, since they cannot sit on a grid", () => {
      renderCalendar({
        camps: [camp(), camp({ id: 2, startDate: null })],
      });

      expect(screen.getByText(/1 camp with no scheduled date/)).toBeInTheDocument();
    });

    it("pluralizes the note", () => {
      renderCalendar({
        camps: [
          camp(),
          camp({ id: 2, startDate: null }),
          camp({ id: 3, startDate: null }),
        ],
      });

      expect(screen.getByText(/2 camps with no scheduled date/)).toBeInTheDocument();
    });

    it("says nothing when every camp has a date", () => {
      renderCalendar();

      expect(screen.queryByText(/no scheduled date/)).not.toBeInTheDocument();
    });
  });
});
