import { render, screen } from "@testing-library/react";

import { WordCampCard } from "@/components/WordCampCard";

const camp = (overrides = {}) => ({
  id: 1,
  title: "WordCamp Rome",
  url: "https://rome.wordcamp.org/2026/",
  startDate: new Date("2026-03-14T00:00:00Z"),
  endDate: null,
  location: "Rome, Italy",
  venue: "",
  ...overrides,
});

describe("WordCampCard", () => {
  it("renders the title as a link to the event", () => {
    render(<WordCampCard camp={camp()} />);

    const link = screen.getByRole("link", { name: "WordCamp Rome" });
    expect(link).toHaveAttribute("href", "https://rome.wordcamp.org/2026/");
  });

  it("opens external links safely", () => {
    // noopener denies the opened page access to window.opener; noreferrer
    // withholds the referrer. Both are required on every external link here.
    render(<WordCampCard camp={camp()} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders a plain title when the camp has no usable URL", () => {
    // The normalizer blanks unsafe (javascript:, data:) and missing URLs, so
    // this path is reachable with real data — not a hypothetical.
    render(<WordCampCard camp={camp({ url: "" })} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "WordCamp Rome" }),
    ).toBeInTheDocument();
  });

  it("renders an entity-decoded title as text, not markup", () => {
    // The title arrives already decoded from the normalizer. If it were ever
    // routed through innerHTML, this would render an element instead of text.
    const hostile = '<img src=x onerror=alert(1)> & "quotes"';
    const { container } = render(
      <WordCampCard camp={camp({ title: hostile })} />,
    );

    expect(screen.getByRole("heading")).toHaveTextContent(hostile);
    expect(container.querySelector("img")).toBeNull();
  });

  it("shows the formatted date", () => {
    render(<WordCampCard camp={camp()} />);

    expect(screen.getByText("Sat, 14 Mar 2026")).toBeInTheDocument();
  });

  it("shows Date TBD when the camp has no date", () => {
    render(<WordCampCard camp={camp({ startDate: null })} />);

    expect(screen.getByText("Date TBD")).toBeInTheDocument();
  });

  it("shows the location when present", () => {
    render(<WordCampCard camp={camp()} />);

    expect(screen.getByText("Rome, Italy")).toBeInTheDocument();
  });

  it("omits the location line entirely when absent", () => {
    // An empty metadata line reads as a rendering bug, not as missing data.
    const { container } = render(
      <WordCampCard camp={camp({ location: "" })} />,
    );

    expect(container.textContent).not.toContain("Rome, Italy");
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("renders as an article, so the list has real structure", () => {
    const { container } = render(<WordCampCard camp={camp()} />);

    expect(container.firstChild.tagName).toBe("ARTICLE");
  });
});
