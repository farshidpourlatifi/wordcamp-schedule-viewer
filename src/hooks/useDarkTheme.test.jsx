import { renderHook, act } from "@testing-library/react";

import { useDarkTheme } from "@/hooks/useDarkTheme";

const root = document.documentElement;

afterEach(() => {
  root.classList.remove("dark");
});

describe("useDarkTheme", () => {
  it("reads the initial theme from the html class", () => {
    root.classList.add("dark");

    const { result } = renderHook(() => useDarkTheme());

    expect(result.current).toBe(true);
  });

  it("is false when the class is absent", () => {
    const { result } = renderHook(() => useDarkTheme());

    expect(result.current).toBe(false);
  });

  it("reacts when the theme is toggled on", async () => {
    const { result } = renderHook(() => useDarkTheme());
    expect(result.current).toBe(false);

    // MutationObserver delivers on a microtask, so the async act flushes it
    // before the assertion. This mirrors ThemeToggle mutating <html>.
    await act(async () => {
      root.classList.add("dark");
    });

    expect(result.current).toBe(true);
  });

  it("reacts when the theme is toggled back off", async () => {
    root.classList.add("dark");
    const { result } = renderHook(() => useDarkTheme());
    expect(result.current).toBe(true);

    await act(async () => {
      root.classList.remove("dark");
    });

    expect(result.current).toBe(false);
  });

  it("stops observing after unmount", async () => {
    const { result, unmount } = renderHook(() => useDarkTheme());

    unmount();
    await act(async () => {
      root.classList.add("dark");
    });

    // No update after teardown — the observer was disconnected.
    expect(result.current).toBe(false);
  });
});
