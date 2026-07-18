import { render, screen } from "@testing-library/react";

import { Tabs, TabsList, Tab, TabPanel } from "@/components/ui/tabs";

const renderTabs = () =>
  render(
    <Tabs defaultValue="a">
      <TabsList>
        <Tab value="a">First</Tab>
        <Tab value="b">Second</Tab>
      </TabsList>
      <TabPanel value="a">Panel A</TabPanel>
      <TabPanel value="b">Panel B</TabPanel>
    </Tabs>,
  );

describe("Tabs", () => {
  it("renders the ARIA tab pattern", () => {
    renderTabs();

    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel A");
  });

  it("marks the default tab selected", () => {
    renderTabs();

    expect(screen.getByRole("tab", { name: "First" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Second" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("styles the active tab from the primitive's own state attribute", () => {
    // Base UI marks the active tab `data-active` — NOT `data-selected`, which
    // is what this originally styled against. That mistake is invisible in
    // jsdom (no CSS is applied), so it shipped looking correct in tests while
    // the active pill never highlighted in a real browser.
    renderTabs();

    const active = screen.getByRole("tab", { name: "First" });
    expect(active).toHaveAttribute("data-active");
    expect(active.className).toContain("data-[active]:bg-card");
  });

  it("carries the classes that hide a deactivated panel", () => {
    // Guard for a real browser-only bug: Base UI keeps a deactivated panel
    // mounted while it "animates out" (data-ending-style), waiting on a
    // transition this app never runs — so BOTH panels stayed visible at once.
    // jsdom cannot catch it (it applies no CSS and unmounts the panel), so
    // this asserts the hiding classes are present rather than the computed
    // style. Weaker than a visual assertion, but it pins the fix in place.
    renderTabs();

    const panel = screen.getByRole("tabpanel");
    expect(panel.className).toContain("data-[ending-style]:hidden");
    expect(panel.className).toContain("[&[hidden]]:hidden");
  });
});
