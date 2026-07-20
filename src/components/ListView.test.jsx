import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ListView, INITIAL_MONTHS } from "@/components/ListView";

const camp = (id, iso) => ({
  id,
  title: `Camp ${id}`,
  url: "",
  startDate: iso === null ? null : new Date(iso),
  endDate: null,
  location: "",
  venue: "",
});

/** One camp in each of `count` consecutive months, starting January 2026. */
const campsAcrossMonths = (count) =>
  Array.from({ length: count }, (_, index) =>
    camp(`m${index}`, `2026-${String((index % 12) + 1).padStart(2, "0")}-01`),
  ).map((c, index) => ({
    ...c,
    startDate: new Date(Date.UTC(2026 + Math.floor(index / 12), index % 12, 1)),
  }));

const renderView = (props) =>
  render(<ListView emptyMessage="Nothing here." {...props} />);

describe("ListView", () => {
  it("groups camps under month headings", () => {
    renderView({
      camps: [
        camp("a", "2026-03-14T00:00:00Z"),
        camp("b", "2026-03-28T00:00:00Z"),
        camp("c", "2026-04-02T00:00:00Z"),
      ],
    });

    expect(
      screen.getByRole("heading", { level: 2, name: "March 2026" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "April 2026" }),
    ).toBeInTheDocument();
  });

  it("renders a card per camp", () => {
    renderView({
      camps: [
        camp("a", "2026-03-14T00:00:00Z"),
        camp("b", "2026-03-28T00:00:00Z"),
      ],
    });

    expect(
      screen.getByRole("heading", { level: 3, name: "Camp a" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Camp b" }),
    ).toBeInTheDocument();
  });

  it("shows the empty message when there are no camps", () => {
    renderView({ camps: [] });

    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("labels dateless camps under a TBD section", () => {
    renderView({ camps: [camp("a", null)] });

    expect(
      screen.getByRole("heading", { level: 2, name: "Date TBD" }),
    ).toBeInTheDocument();
  });

  describe("progressive reveal", () => {
    it("renders only the first months of a long list", () => {
      // Past runs to ~219 month sections against live data; rendering it all
      // at once is seconds of layout and unusable to scroll.
      renderView({ camps: campsAcrossMonths(INITIAL_MONTHS + 5) });

      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
        INITIAL_MONTHS,
      );
    });

    it("says how many months remain, so the control is not a mystery", () => {
      renderView({ camps: campsAcrossMonths(INITIAL_MONTHS + 5) });

      expect(
        screen.getByRole("button", { name: /Show earlier \(5 more months\)/ }),
      ).toBeInTheDocument();
    });

    it("appends the next batch when activated", async () => {
      const user = userEvent.setup();
      renderView({ camps: campsAcrossMonths(INITIAL_MONTHS + 5) });

      await user.click(screen.getByRole("button"));

      expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(
        INITIAL_MONTHS + 5,
      );
    });

    it("removes the control once everything is shown", async () => {
      const user = userEvent.setup();
      renderView({ camps: campsAcrossMonths(INITIAL_MONTHS + 5) });

      await user.click(screen.getByRole("button"));

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("keeps already-revealed months on screen when revealing more", async () => {
      const user = userEvent.setup();
      renderView({ camps: campsAcrossMonths(INITIAL_MONTHS * 2 + 1) });

      const firstHeading = screen.getAllByRole("heading", { level: 2 })[0]
        .textContent;
      await user.click(screen.getByRole("button"));

      expect(screen.getAllByRole("heading", { level: 2 })[0]).toHaveTextContent(
        firstHeading,
      );
    });

    it("shows no control when the list fits", () => {
      renderView({ camps: campsAcrossMonths(INITIAL_MONTHS) });

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("accepts a caller-supplied reveal label", () => {
      renderView({
        camps: campsAcrossMonths(INITIAL_MONTHS + 1),
        revealLabel: "Show older camps",
      });

      expect(
        screen.getByRole("button", { name: /Show older camps/ }),
      ).toBeInTheDocument();
    });
  });
});
