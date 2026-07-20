// Playwright E2E configuration — hand-written.
//
// Three scenarios only (see e2e/): the happy-path load, switching views and
// tabs, and the error state. This is a small view-only app; a broad E2E suite
// would duplicate what the 255 Jest tests already cover far faster. E2E earns
// its place on the handful of things jsdom cannot see — a real browser
// rendering a real table, real navigation, real network failure.
//
// The WordCamp API is mocked per-test via page.route (see e2e/fixtures.js), so
// the suite is deterministic and never depends on the live 4 MB feed.

const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",

  // No accidental `test.only` reaching CI.
  forbidOnly: !!process.env.CI,

  // CI retries absorb the occasional cold-start flake; locally a failure
  // should just fail so it gets looked at.
  retries: process.env.CI ? 2 : 0,

  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: "http://localhost:3000",
    // A trace on the first retry is enough to debug a CI failure without
    // paying the recording cost on every run.
    trace: "on-first-retry",
  },

  // One browser. The app uses no engine-specific APIs, so a Chromium/Firefox/
  // WebKit matrix would triple the runtime to re-prove the same behaviour.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  // Reuse the webpack dev server. --no-open stops it launching a browser; the
  // dev server's historyApiFallback already serves index.html for any path.
  // Locally an already-running server on 3000 is reused; CI starts its own.
  webServer: {
    command: "npm start -- --no-open",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
