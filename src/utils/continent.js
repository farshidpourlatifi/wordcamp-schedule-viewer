/**
 * Map an ISO 3166-1 alpha-2 country code to a continent.
 *
 * The region filter groups WordCamps by continent, and the API gives a country
 * code (`_venue_country_code`) but not a continent. This is the local lookup
 * that bridges them — no network, no dependency, just a static table.
 *
 * "Americas" is one group rather than North/South: the dataset is thin enough
 * that splitting them would leave near-empty filters, and "Americas" matches
 * how the community usually talks about the region.
 */

/** The continents the filter offers, in display order. Excludes "Unknown". */
export const CONTINENTS = ["Africa", "Americas", "Asia", "Europe", "Oceania"];

/** Fallback for a missing, unknown, or unrecognized code. */
export const UNKNOWN_CONTINENT = "Unknown";

// Country codes grouped by continent. Sourced from the ISO 3166-1 list; kept as
// space-joined strings for readability and split once at module load.
const CODES_BY_CONTINENT = {
  Africa:
    "DZ AO BJ BW BF BI CV CM CF TD KM CD CG CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW",
  Americas:
    "AG AR BS BB BZ BO BR CA CL CO CR CU DM DO EC SV GD GT GY HT HN JM MX NI PA PY PE KN LC VC SR TT US UY VE",
  Asia: "AF AM AZ BH BD BT BN KH CN CY GE IN ID IR IQ IL JP JO KZ KW KG LA LB MY MV MN MM NP KP KR OM PK PS PH QA SA SG LK SY TW TJ TH TL TR TM AE UZ VN YE",
  Europe:
    "AL AD AT BY BE BA BG HR CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA",
  Oceania: "AU FJ KI MH FM NR NZ PW PG WS SB TO TV VU",
};

/** Reverse index: code -> continent, built once. */
const CONTINENT_BY_CODE = new Map();
for (const continent of CONTINENTS) {
  for (const code of CODES_BY_CONTINENT[continent].split(" ")) {
    CONTINENT_BY_CODE.set(code, continent);
  }
}

/**
 * @param {string} countryCode ISO alpha-2, any case; may be "" or undefined.
 * @returns {string} A continent name, or UNKNOWN_CONTINENT.
 */
export function continentFromCountryCode(countryCode) {
  if (typeof countryCode !== "string") return UNKNOWN_CONTINENT;

  return CONTINENT_BY_CODE.get(countryCode.trim().toUpperCase()) ?? UNKNOWN_CONTINENT;
}
