import { render, screen, within } from "@testing-library/react";

// react-leaflet drives real Leaflet, which needs a laid-out DOM that jsdom does
// not provide. These mocks stand in for the map primitives so the test can
// assert MapView's own decisions — which camps become markers, what a popup
// says, whether the unlocated note appears — without a real map. The live map
// is exercised by the Playwright E2E instead.
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tiles" />,
  Marker: ({ children, position }) => (
    <div data-testid="marker" data-position={position.join(",")}>
      {children}
    </div>
  ),
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
}));

jest.mock("react-leaflet-cluster", () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="cluster">{children}</div>,
}));

// The real module only wires up marker icons at import time; a bare stub keeps
// that side effect from touching a real DOM.
jest.mock("leaflet", () => ({
  Icon: { Default: { mergeOptions: jest.fn() } },
}));

import { MapView } from "@/components/MapView";

const camp = (overrides = {}) => ({
  id: 1,
  title: "WordCamp Rome",
  url: "https://rome.wordcamp.org/2026/",
  startDate: new Date("2026-03-14T00:00:00Z"),
  endDate: null,
  location: "Rome, Italy",
  venue: "",
  coordinates: { lat: 41.9, lng: 12.5 },
  timezone: "",
  attendees: null,
  ...overrides,
});

const renderMap = (props) =>
  render(<MapView camps={[camp()]} emptyMessage="Nothing here." {...props} />);

describe("MapView", () => {
  it("shows the empty message when there are no camps", () => {
    renderMap({ camps: [] });

    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
    expect(screen.queryByTestId("map")).not.toBeInTheDocument();
  });

  it("renders in dark mode without falling over", () => {
    // Exercises the dark-tile branch: useDarkTheme reads the html class. The
    // class is set before render and removed only after unmount, so the theme
    // observer never fires a state update outside act().
    document.documentElement.classList.add("dark");
    const { unmount } = render(
      <MapView camps={[camp()]} emptyMessage="Nothing here." />,
    );

    expect(screen.getByTestId("map")).toBeInTheDocument();

    unmount();
    document.documentElement.classList.remove("dark");
  });

  it("places a marker at each located camp's coordinates", () => {
    renderMap();

    const markers = screen.getAllByTestId("marker");
    expect(markers).toHaveLength(1);
    expect(markers[0]).toHaveAttribute("data-position", "41.9,12.5");
  });

  it("renders a marker per located camp", () => {
    renderMap({
      camps: [
        camp({ id: 1, coordinates: { lat: 1, lng: 2 } }),
        camp({ id: 2, coordinates: { lat: 3, lng: 4 } }),
      ],
    });

    expect(screen.getAllByTestId("marker")).toHaveLength(2);
  });

  it("skips camps with no coordinates rather than placing them at (0,0)", () => {
    renderMap({
      camps: [
        camp({ id: 1, coordinates: { lat: 1, lng: 2 } }),
        camp({ id: 2, coordinates: null }),
      ],
    });

    expect(screen.getAllByTestId("marker")).toHaveLength(1);
  });

  it("links the popup to the event with a safe target", () => {
    renderMap();

    const link = within(screen.getByTestId("popup")).getByRole("link", {
      name: "WordCamp Rome",
    });
    expect(link).toHaveAttribute("href", "https://rome.wordcamp.org/2026/");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows the date and location in the popup", () => {
    renderMap();

    const popup = screen.getByTestId("popup");
    expect(within(popup).getByText("Sat, 14 Mar 2026")).toBeInTheDocument();
    expect(within(popup).getByText("Rome, Italy")).toBeInTheDocument();
  });

  it("shows timezone and anticipated attendance when present", () => {
    renderMap({
      camps: [camp({ timezone: "Europe/Rome", attendees: 1200 })],
    });

    const popup = screen.getByTestId("popup");
    expect(within(popup).getByText("Europe/Rome")).toBeInTheDocument();
    // Labelled anticipated, and thousands-formatted.
    expect(within(popup).getByText("~1,200 anticipated")).toBeInTheDocument();
  });

  it("omits timezone and attendance when absent", () => {
    // The base factory has neither, so the popup shows only the core lines.
    renderMap();

    const popup = screen.getByTestId("popup");
    expect(within(popup).queryByText(/anticipated/)).not.toBeInTheDocument();
  });

  it("renders a camp with no safe URL as plain popup text", () => {
    renderMap({ camps: [camp({ url: "" })] });

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("WordCamp Rome")).toBeInTheDocument();
  });

  describe("unlocated camps", () => {
    it("counts the camps it cannot place", () => {
      renderMap({
        camps: [camp(), camp({ id: 2, coordinates: null })],
      });

      expect(
        screen.getByText(/1 camp with no mapped location is not shown/),
      ).toBeInTheDocument();
    });

    it("pluralizes the note", () => {
      renderMap({
        camps: [
          camp(),
          camp({ id: 2, coordinates: null }),
          camp({ id: 3, coordinates: null }),
        ],
      });

      expect(
        screen.getByText(/2 camps with no mapped location are not shown/),
      ).toBeInTheDocument();
    });

    it("says nothing when every camp is placed", () => {
      renderMap();

      expect(screen.queryByText(/no mapped location/)).not.toBeInTheDocument();
    });
  });
});
