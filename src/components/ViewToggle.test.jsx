import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  ViewToggle,
  VIEW_CALENDAR,
  VIEW_LIST,
  VIEW_MAP,
  readStoredView,
  persistView,
} from "@/components/ViewToggle";

afterEach(() => {
  // jsdom shares localStorage across tests in a file; a leaked view would
  // silently change what the next test starts from.
  localStorage.clear();
});

describe("ViewToggle", () => {
  it("marks the active view as pressed", () => {
    render(<ViewToggle view={VIEW_CALENDAR} onViewChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Calendar" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("moves the pressed state with the active view", () => {
    render(<ViewToggle view={VIEW_LIST} onViewChange={() => {}} />);

    expect(screen.getByRole("button", { name: "List" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("offers all three views", () => {
    render(<ViewToggle view={VIEW_CALENDAR} onViewChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Calendar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Map" })).toBeInTheDocument();
  });

  it("reports the view the user picked", async () => {
    const user = userEvent.setup();
    const onViewChange = jest.fn();
    render(<ViewToggle view={VIEW_CALENDAR} onViewChange={onViewChange} />);

    await user.click(screen.getByRole("button", { name: "Map" }));

    expect(onViewChange).toHaveBeenCalledWith(VIEW_MAP);
  });

  it("is reachable as a labelled group", () => {
    render(<ViewToggle view={VIEW_CALENDAR} onViewChange={() => {}} />);

    expect(screen.getByRole("group", { name: "Schedule view" })).toBeInTheDocument();
  });
});

describe("readStoredView", () => {
  it("defaults to the calendar, the required primary view", () => {
    expect(readStoredView()).toBe(VIEW_CALENDAR);
  });

  it("returns a stored list preference", () => {
    localStorage.setItem("schedule-view", VIEW_LIST);

    expect(readStoredView()).toBe(VIEW_LIST);
  });

  it("returns a stored map preference", () => {
    localStorage.setItem("schedule-view", VIEW_MAP);

    expect(readStoredView()).toBe(VIEW_MAP);
  });

  it("falls back when the stored value is unrecognized", () => {
    localStorage.setItem("schedule-view", "gallery");

    expect(readStoredView()).toBe(VIEW_CALENDAR);
  });

  it("falls back when storage throws", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(readStoredView()).toBe(VIEW_CALENDAR);
  });
});

describe("persistView", () => {
  it("stores the choice", () => {
    persistView(VIEW_LIST);

    expect(localStorage.getItem("schedule-view")).toBe(VIEW_LIST);
  });

  it("survives storage being unavailable", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => persistView(VIEW_LIST)).not.toThrow();
  });
});
