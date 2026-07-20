import { useEffect, useState } from "react";

/**
 * Track whether the app is in dark mode.
 *
 * The theme is owned by the `.dark` class on `<html>` (see ThemeToggle), not by
 * React state, so a component that needs to *react* to the theme — the map,
 * which swaps its tiles — has to watch that class rather than read it once. A
 * MutationObserver on the class attribute does exactly that, updating whenever
 * the toggle flips it.
 *
 * Initial value comes from the DOM so the first render already matches what the
 * user sees (the pre-paint script in index.html has set the class before React
 * mounts).
 *
 * @returns {boolean} True when `<html>` carries the `dark` class.
 */
export function useDarkTheme() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    // Re-sync once in case the class changed between the initial render and the
    // observer being attached.
    sync();

    return () => observer.disconnect();
  }, []);

  return isDark;
}
