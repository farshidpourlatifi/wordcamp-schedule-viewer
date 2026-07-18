/**
 * ESLint configuration (flat config, ESLint 9).
 *
 * Three plugin sets, each earning its place:
 *   - react + react-hooks: catch the mistakes that survive a passing test run
 *     (missing deps, conditional hooks).
 *   - jsx-a11y: accessibility is graded here indirectly via Lighthouse, and
 *     static checks catch a11y regressions before the audit does.
 *   - eslint-config-prettier LAST, to switch off stylistic rules that would
 *     otherwise fight Prettier over formatting.
 */

const js = require("@eslint/js");
const globals = require("globals");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const jsxA11y = require("eslint-plugin-jsx-a11y");
const prettier = require("eslint-config-prettier");

module.exports = [
  // Never lint generated or vendored output.
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "playwright-report/**",
    ],
  },

  js.configs.recommended,

  // Application source: browser globals, JSX, React rules.
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.browser,
    },
    settings: { react: { version: "detect" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      // PropTypes add runtime type ceremony to a small app that has no public
      // component API. KISS — the components are consumed only in this repo.
      "react/prop-types": "off",

      // Unused args are often intentional (event handlers, injected deps);
      // allow an underscore prefix to mark them as deliberate.
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],

      // console.error/warn are legitimate for surfacing real failures;
      // stray console.log is debugging residue that should not ship.
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Complexity half of a CRAP-style risk bound: risk is high complexity
      // AND weak tests, so both ends are capped. Cyclomatic complexity and
      // nesting are bounded here; test meaningfulness is proven by the Stryker
      // mutation score (Phase 7). A function that trips these gets split —
      // the limits do not move.
      complexity: ["error", 10],
      "max-depth": ["error", 3],
    },
  },

  // Test files additionally run in Jest's environment.
  {
    files: ["src/**/*.test.{js,jsx}", "jest.setup.js"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.jest, ...globals.node },
    },
  },

  // Build/tooling configs are CommonJS and run in Node, not the browser.
  // (jest.setup.js is excluded: it is ESM and covered by the test block above.)
  {
    files: ["*.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },

  prettier,
];
