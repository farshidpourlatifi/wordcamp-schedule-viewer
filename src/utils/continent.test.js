import {
  continentFromCountryCode,
  CONTINENTS,
  UNKNOWN_CONTINENT,
} from "@/utils/continent";

describe("continentFromCountryCode", () => {
  it("maps a representative code from every continent", () => {
    expect(continentFromCountryCode("NG")).toBe("Africa");
    expect(continentFromCountryCode("US")).toBe("Americas");
    expect(continentFromCountryCode("NP")).toBe("Asia");
    expect(continentFromCountryCode("GB")).toBe("Europe");
    expect(continentFromCountryCode("AU")).toBe("Oceania");
  });

  it("is case- and whitespace-insensitive", () => {
    // The API sends upper-case, but a lower-case or padded value must still map.
    expect(continentFromCountryCode("np")).toBe("Asia");
    expect(continentFromCountryCode("  in  ")).toBe("Asia");
  });

  it("returns Unknown for an unrecognized code", () => {
    expect(continentFromCountryCode("ZZ")).toBe(UNKNOWN_CONTINENT);
  });

  it("returns Unknown for an empty or non-string input", () => {
    expect(continentFromCountryCode("")).toBe(UNKNOWN_CONTINENT);
    expect(continentFromCountryCode(undefined)).toBe(UNKNOWN_CONTINENT);
    expect(continentFromCountryCode(null)).toBe(UNKNOWN_CONTINENT);
  });

  it("keeps the Americas as a single group", () => {
    // Both a North and a South American code land in the same bucket.
    expect(continentFromCountryCode("CA")).toBe("Americas");
    expect(continentFromCountryCode("BR")).toBe("Americas");
  });

  it("offers five continents in display order", () => {
    expect(CONTINENTS).toEqual([
      "Africa",
      "Americas",
      "Asia",
      "Europe",
      "Oceania",
    ]);
  });
});
