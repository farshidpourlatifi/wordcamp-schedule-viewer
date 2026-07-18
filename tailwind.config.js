/**
 * Tailwind configuration — set up by hand (no `npx tailwindcss init`).
 *
 * The colour values themselves live in `src/styles/globals.css` as OKLCH
 * custom properties under `:root` / `.dark`. This file only maps those
 * variables onto *semantic* Tailwind class names, which gives two things:
 *
 *   1. One source of truth for colour. Dark mode is a variable swap, not a
 *      second set of `dark:` utilities on every element.
 *   2. Components reference intent (`bg-card`, `text-muted-foreground`) rather
 *      than raw colour, so the palette can change without touching components.
 *
 * See `.claude/skills/wordcamp-design-system/SKILL.md` for the token contract.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Class-based dark mode: the theme toggle puts `.dark` on <html>, which lets
  // a user override the OS preference (media-query mode cannot be overridden).
  darkMode: "class",

  // Files Tailwind scans for class names when tree-shaking the stylesheet.
  content: ["./public/index.html", "./src/**/*.{js,jsx}"],

  theme: {
    extend: {
      colors: {
        // Each entry resolves to a full OKLCH colour declared in globals.css.
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: "var(--destructive)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },

      // Derived from a single `--radius` so shapes stay proportional.
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },

  // No plugins: the app needs no forms/typography resets, and an unused plugin
  // is one more thing for a reviewer to wonder about.
  plugins: [],
};
