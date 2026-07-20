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
 * The calendar opens on the real current month, so month-specific behaviour is
 * asserted in MonthCalendar's own suite where the clock is injected. Here the
 * calendar is checked for being wired up at all, which is what cannot rot.
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
    title: "WordCamp History Osaka",
    startSeconds: PAST_SECONDS,
    location: "Osaka, Japan",
    countryCode: "JP",
  }),
];

/** Which side of "now" a raw record falls on (mirrors the real partition). */
const isUpcoming = (record) =>
  Number(record["Start Date (YYYY-mm-dd)"]) * 1000 >= Date.now();

/** The records a given status query should return; the count query gets all. */
const bodyForStatus = (status, records) => {
  if (status === "wcpt-scheduled") return records.filter(isUpcoming);
  if (status === "wcpt-closed") return records.filter((r) => !isUpcoming(r));
  return records;
};

/**
 * Status-aware fetch mock: scheduled and closed return disjoint sides, and the
 * count query (no status) reports the full total through the header.
 */
const mockCamps = (records) => {
  global.fetch = jest.fn((url) =>
    Promise.resolve(
      apiResponse(bodyForStatus(new URL(url).searchParams.get("status"), records)),
    ),
  );
};

const mockFetch = (impl) => {
  global.fetch = jest.fn(impl);
};

/** Land the app on a specific view via the stored preference. */
const renderInView = (view) => {
  localStorage.setItem("schedule-view", view);
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
  });

  it("recovers when a retry succeeds", async () => {
    const user = userEvent.setup();
    let failScheduled = true;
    global.fetch = jest.fn((url) => {
      const status = new URL(url).searchParams.get("status");
      if (status === "wcpt-scheduled" && failScheduled) {
        failScheduled = false;
        return Promise.resolve({
          ok: false,
          status: 500,
          headers: { get: () => null },
          json: async () => null,
        });
      }
      return Promise.resolve(apiResponse(bodyForStatus(status, RECORDS)));
    });

    renderWithQuery(<App />);
    await user.click(
      within(await screen.findByRole("alert")).getByRole("button"),
    );

    expect(
      await screen.findByRole("tab", { name: /Upcoming/ }),
    ).toBeInTheDocument();
  });

  it("shows an empty message when the API returns nothing", async () => {
    mockCamps([]);

    renderWithQuery(<App />);

    expect(
      await screen.findByText("No upcoming WordCamps found."),
    ).toBeInTheDocument();
  });

  it("renders one h1 inside a main landmark", async () => {
    mockCamps(RECORDS);

    renderWithQuery(<App />);
    await screen.findByRole("tab", { name: /Upcoming/ });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  describe("list view (the default)", () => {
    it("opens on the list, whose upcoming tab needs only the fast feed", async () => {
      mockCamps(RECORDS);

      renderWithQuery(<App />);

      expect(
        await screen.findByRole("link", { name: "WordCamp Future – Rome" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "List" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.queryByText("WordCamp History Osaka")).not.toBeInTheDocument();
    });

    it("labels each tab with its count, the past one from the header", async () => {
      mockCamps(RECORDS);

      renderWithQuery(<App />);

      // Past (1) comes from the total header (2) minus upcoming (1) — no past
      // records have been loaded yet.
      expect(
        await screen.findByRole("tab", { name: "Upcoming (1)" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Past (1)" })).toBeInTheDocument();
    });

    it("loads the archive and shows past camps when the Past tab opens", async () => {
      const user = userEvent.setup();
      mockCamps(RECORDS);

      renderWithQuery(<App />);
      await user.click(await screen.findByRole("tab", { name: /Past/ }));

      expect(
        await screen.findByText("WordCamp History Osaka"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "WordCamp Future – Rome" }),
      ).not.toBeInTheDocument();
    });

    it("switches tabs with the keyboard, using manual activation", async () => {
      const user = userEvent.setup();
      mockCamps(RECORDS);

      renderWithQuery(<App />);
      const upcomingTab = await screen.findByRole("tab", { name: /Upcoming/ });
      const pastTab = screen.getByRole("tab", { name: /Past/ });

      await user.click(upcomingTab);
      await user.keyboard("{ArrowRight}");

      expect(pastTab).toHaveFocus();
      expect(pastTab).toHaveAttribute("aria-selected", "false");

      await user.keyboard("{Enter}");

      expect(pastTab).toHaveAttribute("aria-selected", "true");
      expect(
        await screen.findByText("WordCamp History Osaka"),
      ).toBeInTheDocument();
    });

    it("loads the scheduled feed eagerly and the archive only on demand", async () => {
      const user = userEvent.setup();
      mockCamps(RECORDS);

      renderWithQuery(<App />);
      await screen.findByRole("tab", { name: /Upcoming/ });

      // Count + scheduled up front; the closed archive is untouched.
      expect(global.fetch).toHaveBeenCalledTimes(2);

      await user.click(screen.getByRole("tab", { name: /Past/ }));

      // Opening Past pulls the archive in — once.
      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(3));
      await user.click(screen.getByRole("tab", { name: /Upcoming/ }));
      await user.click(screen.getByRole("tab", { name: /Past/ }));
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("calendar view", () => {
    it("renders a real table and pulls the archive it needs", async () => {
      mockCamps(RECORDS);

      renderInView("calendar");

      // The calendar shows the whole timeline, so it requests the past archive
      // on mount; the table labels itself by the month on show.
      expect(
        await screen.findByRole("table", { name: /WordCamps in/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Calendar" }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    it("carries no upcoming/past tabs", async () => {
      mockCamps(RECORDS);

      renderInView("calendar");
      await screen.findByRole("table", { name: /WordCamps in/ });

      expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    });

    it("reaches both sides of today once the archive is in", async () => {
      mockCamps(RECORDS);

      renderInView("calendar");
      await screen.findByRole("table", { name: /WordCamps in/ });

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Previous month" }),
        ).toBeEnabled(),
      );
      expect(screen.getByRole("button", { name: "Next month" })).toBeEnabled();
    });
  });

  describe("view switching", () => {
    it("swaps the list for the calendar and drops the tabs", async () => {
      const user = userEvent.setup();
      mockCamps(RECORDS);

      renderWithQuery(<App />);
      await user.click(await screen.findByRole("button", { name: "Calendar" }));

      expect(screen.queryByRole("tab")).not.toBeInTheDocument();
      expect(
        await screen.findByRole("table", { name: /WordCamps in/ }),
      ).toBeInTheDocument();
    });

    it("brings the tabs back with the list", async () => {
      const user = userEvent.setup();
      mockCamps(RECORDS);

      renderInView("calendar");
      await user.click(await screen.findByRole("button", { name: "List" }));

      expect(screen.getByRole("tab", { name: /Upcoming/ })).toBeInTheDocument();
    });

    it("remembers the view for the next visit", async () => {
      const user = userEvent.setup();
      mockCamps(RECORDS);

      renderWithQuery(<App />);
      await user.click(await screen.findByRole("button", { name: "Calendar" }));

      expect(localStorage.getItem("schedule-view")).toBe("calendar");
    });

    it("shows the map under the same tabs as the list", async () => {
      const user = userEvent.setup();
      mockCamps(RECORDS);

      renderWithQuery(<App />);
      await user.click(await screen.findByRole("button", { name: "Map" }));

      // The map is lazily loaded, so it arrives asynchronously.
      expect(await screen.findByTestId("map-view")).toBeInTheDocument();
      expect(screen.getByTestId("map-view")).toHaveTextContent("1 on the map");
      expect(screen.getByRole("tab", { name: /Upcoming/ })).toBeInTheDocument();
    });

    it("feeds the map's past tab from the loaded archive", async () => {
      const user = userEvent.setup();
      mockCamps(RECORDS);

      renderWithQuery(<App />);
      await user.click(await screen.findByRole("button", { name: "Map" }));
      await screen.findByTestId("map-view");

      await user.click(screen.getByRole("tab", { name: /Past/ }));

      expect(await screen.findByTestId("map-view")).toHaveTextContent(
        "1 on the map",
      );
    });
  });

  describe("lazy archive", () => {
    it("notes the archive is loading, then clears it, on the calendar", async () => {
      let releaseArchive;
      const archiveReady = new Promise((resolve) => {
        releaseArchive = resolve;
      });

      global.fetch = jest.fn((url) => {
        const status = new URL(url).searchParams.get("status");
        if (status === "wcpt-closed") {
          return archiveReady.then(() =>
            apiResponse(bodyForStatus(status, RECORDS)),
          );
        }
        return Promise.resolve(apiResponse(bodyForStatus(status, RECORDS)));
      });

      // The calendar requests the archive on mount.
      renderInView("calendar");

      // Once the calendar has rendered (scheduled loaded, skeleton gone), the
      // only status region is the archive announcement; the visible spinner
      // beside it is aria-hidden.
      await screen.findByRole("table", { name: /WordCamps in/ });
      expect(screen.getByRole("status")).toHaveTextContent(
        "Loading past events…",
      );

      releaseArchive();

      await waitFor(() =>
        expect(screen.queryByRole("status")).not.toBeInTheDocument(),
      );
    });

    it("does not fetch the archive until something needs it", async () => {
      mockCamps(RECORDS);

      renderWithQuery(<App />);
      await screen.findByRole("tab", { name: /Upcoming/ });

      // Only count + scheduled — no wcpt-closed request has gone out.
      const statuses = global.fetch.mock.calls.map(
        ([url]) => new URL(url).searchParams.get("status"),
      );
      expect(statuses).not.toContain("wcpt-closed");
    });
  });

  describe("filters", () => {
    it("shows the total from the header", async () => {
      mockCamps(RECORDS);

      renderWithQuery(<App />);

      expect(await screen.findByText("2 events")).toBeInTheDocument();
    });

    it("narrows the result count as you search", async () => {
      const user = userEvent.setup();
      mockCamps(RECORDS);

      renderWithQuery(<App />);
      await user.type(await screen.findByRole("searchbox"), "rome");

      expect(await screen.findByText("1 of 2 events")).toBeInTheDocument();
    });

    it("filters the visible list by search", async () => {
      const user = userEvent.setup();
      mockCamps(RECORDS);

      renderWithQuery(<App />);
      await user.type(await screen.findByRole("searchbox"), "rome");

      expect(
        screen.getByRole("link", { name: "WordCamp Future – Rome" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Upcoming (1)" })).toBeInTheDocument();
    });

    it("filters by region, loading the archive to reach past events", async () => {
      const user = userEvent.setup();
      mockCamps(RECORDS);

      renderWithQuery(<App />);
      await user.selectOptions(
        await screen.findByRole("combobox", { name: /region/i }),
        "Asia",
      );

      // Osaka (JP → Asia) is a past event, so selecting Asia must pull the
      // archive in and then match it.
      expect(await screen.findByText("1 of 2 events")).toBeInTheDocument();
    });

    it("says so when a filter matches nothing", async () => {
      const user = userEvent.setup();
      mockCamps(RECORDS);

      renderWithQuery(<App />);
      await user.type(await screen.findByRole("searchbox"), "nairobi");

      expect(
        await screen.findByText("No WordCamps match your search."),
      ).toBeInTheDocument();
    });
  });
});
