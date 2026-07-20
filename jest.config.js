/**
 * Jest configuration — hand-written.
 *
 * The assignment requires a minimum of 60% coverage, so that floor is enforced
 * here via `coverageThreshold` rather than left to a human to check: a shortfall
 * fails `npm run test:coverage` (and CI) with a non-zero exit code.
 */

module.exports = {
  // React components need DOM globals; the default `node` environment has none.
  testEnvironment: "jsdom",

  // Transpile through the shared root Babel config (see babel.config.js) so
  // tests and the shipped bundle are compiled identically.
  transform: { "^.+\\.jsx?$": "babel-jest" },

  // Only files named *.test.js(x) are suites.
  //
  // This is deliberate, not cosmetic: Jest's default patterns treat EVERY file
  // inside a `__tests__/` folder as a suite, so a shared fixtures module there
  // fails the run with "must contain at least one test". Scoping testMatch
  // means helpers and fixtures can live anywhere without tripping it.
  testMatch: ["<rootDir>/src/**/*.test.{js,jsx}"],

  // Registers @testing-library/jest-dom's matchers (toBeInTheDocument etc.)
  // and the global-fetch tripwire.
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  moduleNameMapper: {
    // Mirrors the webpack `@` alias so imports resolve the same way in tests.
    "^@/(.*)$": "<rootDir>/src/$1",
    // Jest cannot parse CSS. Components import stylesheets for their side
    // effect only, so mapping them to an empty stub is sufficient — we assert
    // on behaviour and semantics, never on computed styles.
    "\\.css$": "<rootDir>/src/test/styleStub.js",
    // Likewise for image assets (e.g. Leaflet's marker icons): Jest cannot
    // parse a binary as a module, so it resolves to a stand-in URL string.
    "\\.(png|jpe?g|gif|svg|webp|ico)$": "<rootDir>/src/test/fileStub.js",
  },

  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    // Entry point is a three-line createRoot call with no logic worth testing;
    // including it would only dilute the percentages.
    "!src/index.js",
    // Test scaffolding is not application code.
    "!src/test/**",
    "!src/**/*.test.{js,jsx}",
  ],

  // The assignment floor. Raise it as real coverage climbs; never lower it.
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },

  coverageReporters: ["text", "lcov"],

  // Reset mock state and implementations between tests so suites cannot leak
  // stubbed behaviour into each other and pass for the wrong reason.
  clearMocks: true,
  restoreMocks: true,
};
