import { renderHook, act } from "@testing-library/react";

import { useCampFilters } from "@/hooks/useCampFilters";
import { ALL_REGIONS } from "@/utils/filterCamps";

const camp = (id, overrides = {}) => ({
  id,
  title: `Camp ${id}`,
  location: "",
  country: "",
  venue: "",
  continent: "Europe",
  ...overrides,
});

const rome = camp(1, { title: "WordCamp Rome", continent: "Europe" });
const osaka = camp(2, { title: "WordCamp Osaka", continent: "Asia" });

describe("useCampFilters", () => {
  it("starts unfiltered, returning the lists untouched", () => {
    const { result } = renderHook(() =>
      useCampFilters([rome, osaka], [rome], [osaka]),
    );

    expect(result.current.query).toBe("");
    expect(result.current.region).toBe(ALL_REGIONS);
    expect(result.current.isFiltering).toBe(false);
    expect(result.current.shownCamps).toEqual([rome, osaka]);
    expect(result.current.shownUpcoming).toEqual([rome]);
    expect(result.current.shownPast).toEqual([osaka]);
  });

  it("applies a query across all three lists at once", () => {
    const { result } = renderHook(() =>
      useCampFilters([rome, osaka], [rome], [osaka]),
    );

    act(() => result.current.setQuery("osaka"));

    expect(result.current.isFiltering).toBe(true);
    expect(result.current.shownCamps).toEqual([osaka]);
    expect(result.current.shownUpcoming).toEqual([]);
    expect(result.current.shownPast).toEqual([osaka]);
  });

  it("applies a region filter", () => {
    const { result } = renderHook(() =>
      useCampFilters([rome, osaka], [rome], [osaka]),
    );

    act(() => result.current.setRegion("Europe"));

    expect(result.current.isFiltering).toBe(true);
    expect(result.current.shownCamps).toEqual([rome]);
  });

  it("treats a whitespace-only query as no filter", () => {
    const { result } = renderHook(() =>
      useCampFilters([rome, osaka], [rome], [osaka]),
    );

    act(() => result.current.setQuery("   "));

    expect(result.current.isFiltering).toBe(false);
  });
});
