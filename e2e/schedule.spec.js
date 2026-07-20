// End-to-end scenarios, in a real browser, against a mocked WordCamp API.
//
// Three, deliberately: the happy-path load, switching between views and tabs,
// and the error path. Everything finer-grained is already covered by the Jest
// suite; these prove the pieces work together in a browser the way unit tests
// running in jsdom cannot.

const { test, expect } = require("@playwright/test");
const { mockWordCamps, failWordCamps } = require("./fixtures");

test("loads and shows the calendar, the default view", async ({ page }) => {
  await mockWordCamps(page);
  await page.goto("/");

  // The calendar is the required primary view, so a cold load lands on it —
  // a real <table>, which is exactly what jsdom's lack of layout can't vouch
  // for. The title is entity-decoded end to end (&#8211; → –).
  await expect(
    page.getByRole("table", { name: /WordCamps in/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Calendar" }),
  ).toHaveAttribute("aria-pressed", "true");

  // No upcoming/past tabs over the calendar — they filter the list only.
  await expect(page.getByRole("tab")).toHaveCount(0);
});

test("switches to the list and between its tabs", async ({ page }) => {
  await mockWordCamps(page);
  await page.goto("/");

  await page.getByRole("button", { name: "List" }).click();

  // The tabs appear with the list, labelled by their counts, and Upcoming
  // shows the future camp.
  await expect(page.getByRole("tab", { name: /Upcoming/ })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "WordCamp Future – Rome" }),
  ).toBeVisible();
  await expect(page.getByText("WordCamp History Osaka")).toBeHidden();

  // Switching to Past swaps the content.
  await page.getByRole("tab", { name: /Past/ }).click();
  await expect(page.getByText("WordCamp History Osaka")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "WordCamp Future – Rome" }),
  ).toBeHidden();
});

test("renders the map with a real Leaflet marker", async ({ page }) => {
  await mockWordCamps(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Map" }).click();

  // The map is a lazily-loaded chunk driving real Leaflet — the one view jsdom
  // cannot render, so this is where E2E earns its keep. The container and its
  // required OSM attribution prove the map mounted; a marker proves the
  // upcoming camp's coordinates reached it.
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.getByText(/OpenStreetMap/)).toBeVisible();
  await expect(page.locator(".leaflet-marker-icon").first()).toBeVisible();
});

test("shows the error state when the API fails", async ({ page }) => {
  await failWordCamps(page);
  await page.goto("/");

  // A real network failure — not a rejected promise in a test — reaches the
  // alert, with the retry affordance and the underlying status for a report.
  const alert = page.getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("Could not load WordCamps");
  await expect(
    page.getByRole("button", { name: /try again/i }),
  ).toBeVisible();
});
