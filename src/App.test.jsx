import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// The map is lazily imported and drives real Leaflet, which jsdom cannot lay
// out. A light stand-in lets the App-level tests prove the map is wired into
// the view toggle and tabs; the real map is covered by the Playwright E2E.
jest.mock("@/components/MapView", () => ({
  MapView: ({ camps }) => (
    <div data-testid="map-view">{camps.length} on the map</div>
  ),
}));

import { App } from "@/App";
import {
  renderWithQuery,
  apiResponse,
  apiRecord,
} from "@/test/renderWithQuery";

/**
 * App-level integration: the real hook, the real utils, the real components —
 * only the network is faked. These are the tests that would catch a wiring
 * mistake no unit test can see.
 *
 * The calendar opens on the real current month, so month-specific behaviour
 * (today's marker, navigation, clamping) is asserted in MonthCalendar's own
 * suite where the clock is injected. Here the calendar is checked for being
 * wired up at all, which is what cannot rot.
 */

/** 2099 and 2001: far enough either side of any real "today" to be stable. */
const FUTURE_SECONDS = String(Math.floor(Date.UTC(2099, 2, 14) / 1000));
const PAST_SECONDS = String(Math.floor(Date.UTC(2001, 5, 2) / 1000));

const RECORDS = [
  apiRecord({
    id: 1,
    title: "WordCamp Future &#8211; Rome",
    startSeconds: FUTURE_SECONDS,
    location: "Rome, Italy",
    url: "https://rome.wordcamp.org/2099/",
    countryCode: "IT",
  }),
  apiRecord({
    id: 2,
    title: "WordCamp History",
    startSeconds: PAST_SECONDS,
    location: "Osaka, Japan",
    countryCode: "JP",
  }),
];

const mockFetch = (impl) => {
  global.fetch = jest.fn(impl);
};

/** Start in the list view, where the upcoming/past tabs live. */
const renderInListView = () => {
  localStorage.setItem("schedule-view", "list");

  return renderWithQuery(<App />);
};

afterEach(() => {
  localStorage.clear();
});

describe("App", () => {
  it("shows a loading state before data arrives", () => {
    // A pending promise holds the app in its loading state.
    mockFetch(() => new Promise(() => {}));

    renderWithQuery(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading WordCamps");
  });

  it("shows an error state when the API fails", async () => {
    mockFetch(async () => ({
      ok: false,
      status: 503,
      headers: { get: () => null },
      json: async () => null,
    }));

    renderWithQuery(<App />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Could not load WordCamps.");
    // The underlying reason is shown too — that is what makes a bug report
    // actionable, where a friendly sentence alone would not.
    expect(alert).toHaveTextContent("HTTP 503");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("recovers when a retry succeeds", async () => {
    const user = userEvent.setup();
    let attempt = 0;
    mockFetch(async () => {
      attempt += 1;
      return attempt === 1
        ? {
            ok: false,
            status: 500,
            headers: { get: () => null },
            json: async () => null,
          }
        : apiResponse(RECORDS);
    });

    renderWithQuery(<App />);
    await user.click(
      within(await screen.findByRole("alert")).getByRole("button"),
    );

    expect(await screen.findByRole("table", { name: /WordCamps in/ })).toBeInTheDocument();
  });

  it("shows an empty message when the API returns nothing", async () => {
    mockFetch(async () => apiResponse([]));

    renderWithQuery(<App />);

    expect(await screen.findByText("No WordCamps found.")).toBeInTheDocument();
  });

  it("renders one h1 inside a main landmark", async () => {
    mockFetch(async () => apiResponse(RECORDS));

    renderWithQuery(<App />);
    await screen.findByRole("table", { name: /WordCamps in/ });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  describe("calendar view", () => {
    it("is what the app opens on, being the required primary view", async () => {
      mockFetch(async () => apiResponse(RECORDS));

      renderWithQuery(<App />);

      expect(
        await screen.findByRole("table", { name: /WordCamps in/ }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Calendar" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    it("carries no upcoming/past tabs", async () => {
      mockFetch(async () => apiResponse(RECORDS));

      renderWithQuery(<App />);
      await screen.findByRole("table", { name: /WordCamps in/ });

      // A calendar is continuous time and already marks today; splitting it in
      // two would render the same month twice with different subsets.
      expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    });

    it("draws on the whole timeline, not one side of today", async () => {
      mockFetch(async () => apiResponse(RECORDS));

      renderWithQuery(<App />);
      await screen.findByRole("table", { name: /WordCamps in/ });

      // Both camps are decades from the opening month, so neither shows yet —
      // but navigation reaches both, which the clamped bounds prove.
      expect(
        screen.getByRole("button", { name: "Previous month" }),
      ).toBeEnabled();
      expect(screen.getByRole("button", { name: "Next month" })).toBeEnabled();
    });
  });

  describe("list view", () => {
    it("shows upcoming camps by default once loaded", async () => {
      mockFetch(async () => apiResponse(RECORDS));

      renderInListView();

      // Title is entity-decoded end to end — proof the normalizer is wired in.
      expect(
        await screen.findByRole("link", { name: "WordCamp Future – Rome" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("WordCamp History")).not.toBeInTheDocument();
    });

    it("labels each tab with its count", async () => {
      mockFetch(async () => apiResponse(RECORDS));

      renderInListView();

      expect(
        await screen.findByRole("tab", { name: "Upcoming (1)" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Past (1)" })).toBeInTheDocument();
    });

    it("shows past camps after switching tabs", async () => {
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderInListView();
      await user.click(await screen.findByRole("tab", { name: /Past/ }));

      expect(await screen.findByText("WordCamp History")).toBeInTheDocument();
      expect(
        screen.queryByText("WordCamp Future – Rome"),
      ).not.toBeInTheDocument();
    });

    it("marks the selected tab for assistive technology", async () => {
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderInListView();
      const pastTab = await screen.findByRole("tab", { name: /Past/ });

      expect(screen.getByRole("tab", { name: /Upcoming/ })).toHaveAttribute(
        "aria-selected",
        "true",
      );

      await user.click(pastTab);

      expect(pastTab).toHaveAttribute("aria-selected", "true");
    });

    it("switches tabs with the keyboard, using manual activation", async () => {
      // Base UI supplies arrow-key navigation; this asserts it survived the
      // styling wrapper rather than trusting the library blindly.
      //
      // Manual activation (the Base UI default) is kept deliberately: arrow
      // keys move focus, Enter/Space activates. With automatic activation,
      // arrowing across the tabs would render the Past panel — twelve month
      // sections of cards — just to pass over it.
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderInListView();
      const upcomingTab = await screen.findByRole("tab", { name: /Upcoming/ });
      const pastTab = screen.getByRole("tab", { name: /Past/ });

      // Focus via user-event rather than a raw .focus() call: the raw call
      // triggers a Base UI state update outside act() and logs a warning.
      // Upcoming is already selected, so clicking it changes focus, not state.
      await user.click(upcomingTab);
      await user.keyboard("{ArrowRight}");

      expect(pastTab).toHaveFocus();
      expect(pastTab).toHaveAttribute("aria-selected", "false");

      await user.keyboard("{Enter}");

      expect(pastTab).toHaveAttribute("aria-selected", "true");
      expect(await screen.findByText("WordCamp History")).toBeInTheDocument();
    });

    it("fetches once for the whole page, not once per tab", async () => {
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderInListView();
      await user.click(await screen.findByRole("tab", { name: /Past/ }));
      await user.click(screen.getByRole("tab", { name: /Upcoming/ }));

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    });
  });

  describe("view switching", () => {
    it("swaps the calendar for the month-section list", async () => {
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderWithQuery(<App />);
      await user.click(await screen.findByRole("button", { name: "List" }));

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: "March 2099" }),
      ).toBeInTheDocument();
    });

    it("brings the tabs back with the list", async () => {
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderWithQuery(<App />);
      await user.click(await screen.findByRole("button", { name: "List" }));

      expect(screen.getByRole("tab", { name: /Upcoming/ })).toBeInTheDocument();
    });

    it("returns to the calendar, dropping the tabs again", async () => {
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderWithQuery(<App />);
      await user.click(await screen.findByRole("button", { name: "List" }));
      await user.click(screen.getByRole("button", { name: "Calendar" }));

      expect(screen.queryByRole("tab")).not.toBeInTheDocument();
      expect(
        screen.getByRole("table", { name: /WordCamps in/ }),
      ).toBeInTheDocument();
    });

    it("remembers the view for the next visit", async () => {
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderWithQuery(<App />);
      await user.click(await screen.findByRole("button", { name: "List" }));

      expect(localStorage.getItem("schedule-view")).toBe("list");
    });

    it("shows the map, under the same tabs as the list", async () => {
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderWithQuery(<App />);
      await user.click(await screen.findByRole("button", { name: "Map" }));

      // The map is lazily loaded, so it arrives asynchronously.
      expect(await screen.findByTestId("map-view")).toBeInTheDocument();
      // One upcoming camp on the default tab.
      expect(screen.getByTestId("map-view")).toHaveTextContent("1 on the map");
      // And it filters through the same tabs.
      expect(screen.getByRole("tab", { name: /Upcoming/ })).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("re-filters the map when the tab changes", async () => {
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderWithQuery(<App />);
      await user.click(await screen.findByRole("button", { name: "Map" }));
      await screen.findByTestId("map-view");

      await user.click(screen.getByRole("tab", { name: /Past/ }));

      // The past tab feeds its one camp to the same map.
      expect(await screen.findByTestId("map-view")).toHaveTextContent(
        "1 on the map",
      );
    });
  });

  describe("filters", () => {
    afterEach(() => localStorage.clear());

    it("shows the total count once loaded", async () => {
      mockFetch(async () => apiResponse(RECORDS));

      renderWithQuery(<App />);

      expect(await screen.findByText("2 events")).toBeInTheDocument();
    });

    it("narrows the result count as you search", async () => {
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderWithQuery(<App />);
      await user.type(await screen.findByRole("searchbox"), "rome");

      expect(await screen.findByText("1 of 2 events")).toBeInTheDocument();
    });

    it("filters the visible list by search", async () => {
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderInListView();
      await user.type(await screen.findByRole("searchbox"), "rome");

      expect(
        screen.getByRole("link", { name: "WordCamp Future – Rome" }),
      ).toBeInTheDocument();
      // The tab count follows the filter down to one match.
      expect(screen.getByRole("tab", { name: "Upcoming (1)" })).toBeInTheDocument();
    });

    it("filters by region using the derived continent", async () => {
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderWithQuery(<App />);
      await user.selectOptions(
        await screen.findByRole("combobox", { name: /region/i }),
        "Asia",
      );

      // Only Osaka (JP → Asia) matches; Rome (IT → Europe) is excluded.
      expect(await screen.findByText("1 of 2 events")).toBeInTheDocument();
    });

    it("says so when a filter matches nothing", async () => {
      const user = userEvent.setup();
      mockFetch(async () => apiResponse(RECORDS));

      renderInListView();
      await user.type(await screen.findByRole("searchbox"), "nairobi");

      expect(
        await screen.findByText("No WordCamps match your search."),
      ).toBeInTheDocument();
    });
  });
});
