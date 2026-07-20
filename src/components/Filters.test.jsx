import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Filters } from "@/components/Filters";
import { ALL_REGIONS } from "@/utils/filterCamps";

const setup = (overrides = {}) => {
  const props = {
    query: "",
    onQueryChange: jest.fn(),
    region: ALL_REGIONS,
    onRegionChange: jest.fn(),
    resultCount: 40,
    totalCount: 40,
    ...overrides,
  };
  render(<Filters {...props} />);
  return props;
};

describe("Filters", () => {
  it("exposes a labelled search box and region select", () => {
    setup();

    expect(screen.getByRole("searchbox", { name: /search/i })).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /region/i }),
    ).toBeInTheDocument();
  });

  it("reports each keystroke to the caller", async () => {
    const user = userEvent.setup();
    const { onQueryChange } = setup();

    await user.type(screen.getByRole("searchbox"), "r");

    expect(onQueryChange).toHaveBeenCalledWith("r");
  });

  it("reports a region choice", async () => {
    const user = userEvent.setup();
    const { onRegionChange } = setup();

    await user.selectOptions(screen.getByRole("combobox"), "Asia");

    expect(onRegionChange).toHaveBeenCalledWith("Asia");
  });

  it("shows the plain total when nothing is filtered", () => {
    setup({ resultCount: 40, totalCount: 40 });

    expect(screen.getByText("40 events")).toBeInTheDocument();
  });

  it("shows the narrowed count when a query is active", () => {
    setup({ query: "rome", resultCount: 1, totalCount: 40 });

    expect(screen.getByText("1 of 40 events")).toBeInTheDocument();
  });

  it("shows the narrowed count when a region is active", () => {
    setup({ region: "Asia", resultCount: 12, totalCount: 40 });

    expect(screen.getByText("12 of 40 events")).toBeInTheDocument();
  });

  it("offers every continent plus an all-regions option", () => {
    setup();

    const options = screen
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(options).toEqual([
      "All regions",
      "Africa",
      "Americas",
      "Asia",
      "Europe",
      "Oceania",
    ]);
  });
});
