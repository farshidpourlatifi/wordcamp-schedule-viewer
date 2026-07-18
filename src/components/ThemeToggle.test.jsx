import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeToggle } from "@/components/ThemeToggle";

describe("ThemeToggle", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");
    localStorage.clear();
  });

  it("initializes from the class already on <html>", () => {
    // index.html applies the theme before first paint, so the DOM — not
    // localStorage — is the source of truth by the time React mounts.
    document.documentElement.classList.add("dark");

    render(<ThemeToggle />);

    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
  });

  it("labels the action, not the current state", () => {
    render(<ThemeToggle />);

    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
  });

  it("adds the dark class and persists the choice", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button"));

    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("toggles back to light and persists that too", async () => {
    const user = userEvent.setup();
    document.documentElement.classList.add("dark");
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button"));

    expect(document.documentElement).not.toHaveClass("dark");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("still toggles when localStorage is unavailable", async () => {
    // Private-mode and blocked-cookie contexts throw on setItem. A theme
    // preference that cannot persist must not take the page down with it.
    const user = userEvent.setup();
    const setItem = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    render(<ThemeToggle />);
    await user.click(screen.getByRole("button"));

    expect(document.documentElement).toHaveClass("dark");
    setItem.mockRestore();
  });
});
