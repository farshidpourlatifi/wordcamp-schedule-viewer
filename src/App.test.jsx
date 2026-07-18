import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
  }),
  apiRecord({
    id: 2,
    title: "WordCamp History",
    startSeconds: PAST_SECONDS,
    location: "Osaka, Japan",
  }),
];

const mockFetch = (impl) => {
  global.fetch = jest.fn(impl);
};

describe("App", () => {
  it("shows a loading state before data arrives", () => {
    // A pending promise holds the app in its loading state.
    mockFetch(() => new Promise(() => {}));

    renderWithQuery(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading WordCamps");
  });

  it("shows upcoming camps by default once loaded", async () => {
    mockFetch(async () => apiResponse(RECORDS));

    renderWithQuery(<App />);

    // Title is entity-decoded end to end — proof the normalizer is wired in.
    expect(
      await screen.findByRole("link", { name: "WordCamp Future – Rome" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("WordCamp History")).not.toBeInTheDocument();
  });

  it("labels each tab with its count", async () => {
    mockFetch(async () => apiResponse(RECORDS));

    renderWithQuery(<App />);

    expect(
      await screen.findByRole("tab", { name: "Upcoming (1)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Past (1)" })).toBeInTheDocument();
  });

  it("shows past camps after switching tabs", async () => {
    const user = userEvent.setup();
    mockFetch(async () => apiResponse(RECORDS));

    renderWithQuery(<App />);
    await user.click(await screen.findByRole("tab", { name: /Past/ }));

    expect(await screen.findByText("WordCamp History")).toBeInTheDocument();
    expect(
      screen.queryByText("WordCamp Future – Rome"),
    ).not.toBeInTheDocument();
  });

  it("marks the selected tab for assistive technology", async () => {
    const user = userEvent.setup();
    mockFetch(async () => apiResponse(RECORDS));

    renderWithQuery(<App />);
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
    // Manual activation (the Base UI default) is kept deliberately: arrow keys
    // move focus, Enter/Space activates. With automatic activation, arrowing
    // across the tabs would render the Past panel — twelve month sections of
    // cards — just to pass over it.
    const user = userEvent.setup();
    mockFetch(async () => apiResponse(RECORDS));

    renderWithQuery(<App />);
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
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
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

    expect(
      await screen.findByRole("tab", { name: /Upcoming/ }),
    ).toBeInTheDocument();
  });

  it("shows an empty message when the API returns nothing", async () => {
    mockFetch(async () => apiResponse([]));

    renderWithQuery(<App />);

    expect(
      await screen.findByText("No upcoming WordCamps with scheduled dates."),
    ).toBeInTheDocument();
  });

  it("renders one h1 inside a main landmark", async () => {
    mockFetch(async () => apiResponse(RECORDS));

    renderWithQuery(<App />);
    await screen.findByRole("tab", { name: /Upcoming/ });

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("fetches once for the whole page, not once per tab", async () => {
    const user = userEvent.setup();
    mockFetch(async () => apiResponse(RECORDS));

    renderWithQuery(<App />);
    await user.click(await screen.findByRole("tab", { name: /Past/ }));
    await user.click(screen.getByRole("tab", { name: /Upcoming/ }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
  });
});
