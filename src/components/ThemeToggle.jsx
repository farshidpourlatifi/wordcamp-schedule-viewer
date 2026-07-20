import { useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Light/dark theme toggle.
 *
 * Initial state is read from the DOM, not from localStorage: `index.html` runs
 * a blocking script that applies the stored (or OS-preferred) theme before
 * first paint, so the class on <html> is already the source of truth by the
 * time React mounts. Re-deriving it here would risk disagreeing with what the
 * user can already see.
 */

/** localStorage key; shared with the pre-paint bootstrap in index.html. */
const STORAGE_KEY = "theme";

/**
 * Persist the choice, ignoring storage failures.
 *
 * localStorage throws in private-mode and blocked-cookie contexts. A theme
 * preference that fails to persist is not worth breaking the page over — the
 * toggle still works for the session.
 */
function persistTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignored deliberately; see above.
  }
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const toggle = () => {
    const next = !isDark;

    document.documentElement.classList.toggle("dark", next);
    persistTheme(next ? "dark" : "light");
    setIsDark(next);
  };

  return (
    <Button
      variant="ghost"
      onClick={toggle}
      // The label states the ACTION, not the current state — that is what a
      // screen-reader user needs to decide whether to press it.
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {/* Lucide sizes to 24 by default; 18 matches the ghost button's
          optical weight. aria-hidden because the button carries the label. */}
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </Button>
  );
}
