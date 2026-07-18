/**
 * Real WordCamp Central API records, captured 2026-07-18 from
 * GET https://central.wordcamp.org/wp-json/wp/v2/wordcamps?per_page=100&page=1
 *
 * Trimmed to the fields the normalizer reads; every value is verbatim from the
 * live response. Chosen to cover the cases the data layer must survive:
 *
 *   [0] upcoming (`wcpt-scheduled`), full meta
 *   [1] past (`wcpt-closed`), full meta
 *   [2] title with a named entity  (`&amp;`)
 *   [3] title with a numeric entity (`&#8217;`)
 *   [4] missing start date AND missing location -> "Date TBD" / hidden-location path
 *
 * API shape notes (verified against the live response, contra some docs):
 *   - Meta fields are TOP-LEVEL on the record, not nested under `meta`.
 *   - `Start Date (YYYY-mm-dd)` is a Unix timestamp in SECONDS, as a STRING,
 *     despite the key name suggesting a date string.
 *   - Absent meta comes back as an empty string, not `null`/`undefined`.
 *   - Pagination: `X-WP-TotalPages` header; 15 pages at per_page=100 (1480 records).
 */
export const wordCampRecords = [
  {
    id: 15221569,
    slug: "wordpress-campus-connect-tegal-regency-public-library-perpustakaan-soekarno-hatta-kabupaten-tegal",
    status: "wcpt-scheduled",
    link: "https://central.wordcamp.org/wordcamps/wordpress-campus-connect-tegal-regency-public-library-perpustakaan-soekarno-hatta-kabupaten-tegal/",
    title: {
      rendered: "WordPress Campus Connect Perpus Soetta Tegal",
    },
    "Start Date (YYYY-mm-dd)": "1786233600",
    "End Date (YYYY-mm-dd)": "1786233600",
    Location: "Tegal Regency, Indonesia",
    URL: "https://events.wordpress.org/campusconnect/2026/perpus-soetta/",
    "Website URL": "https://disperpusip.tegalkab.go.id/news/",
    "Venue Name":
      "Tegal Regency Public Library (Perpustakaan Soekarno-Hatta Kabupaten Tegal)",
    "Event Timezone": "Asia/Jakarta",
    _host_coordinates: "",
    _host_country_name: "",
  },
  {
    id: 14841477,
    slug: "wordpress-campus-connect-uzumasa-campus-kyoto-university-of-advanced-science",
    status: "wcpt-closed",
    link: "https://central.wordcamp.org/wordcamps/wordpress-campus-connect-uzumasa-campus-kyoto-university-of-advanced-science/",
    title: {
      rendered: "WordPress Campus Connect Kyoto University of Advanced Science",
    },
    "Start Date (YYYY-mm-dd)": "1783123200",
    "End Date (YYYY-mm-dd)": "1783123200",
    Location: "Kyoto City, Japan",
    URL: "https://events.wordpress.org/campusconnect/2026/kyoto-sentan/",
    "Website URL": "https://www.kuas.ac.jp/campus/uzumasa/campus-map/",
    "Venue Name": "Uzumasa Campus, Kyoto University of Advanced Science",
    "Event Timezone": "Asia/Tokyo",
    _host_coordinates: "",
    _host_country_name: "",
  },
  {
    id: 13863070,
    slug: "wordpress-campus-connect-pundra-university-of-science-technology-pub",
    status: "wcpt-closed",
    link: "https://central.wordcamp.org/wordcamps/wordpress-campus-connect-pundra-university-of-science-technology-pub/",
    title: {
      rendered:
        "WordPress Campus Connect Pundra University of Science &amp; Technology, Bogura",
    },
    "Start Date (YYYY-mm-dd)": "1776470400",
    "End Date (YYYY-mm-dd)": "1776470400",
    Location: "Bogura, Bangladesh",
    URL: "https://events.wordpress.org/campusconnect/2026/pust-bogura/",
    "Website URL": "",
    "Venue Name": "Pundra University of Science &amp; Technology (PUB)",
    "Event Timezone": "Asia/Dhaka",
    _host_coordinates: "",
    _host_country_name: "",
  },
  {
    id: 13861677,
    slug: "wordpress-campus-connect-st-edwards-s-s-bukuumi",
    status: "wcpt-closed",
    link: "https://central.wordcamp.org/wordcamps/wordpress-campus-connect-st-edwards-s-s-bukuumi/",
    title: {
      rendered: "WordPress Campus Connect St. Edward&#8217;s S.S Bukuumi",
    },
    "Start Date (YYYY-mm-dd)": "1777075200",
    "End Date (YYYY-mm-dd)": "1777075200",
    Location: "Kakumiro, Uganda",
    URL: "https://events.wordpress.org/campusconnect/2026/Kakumiro/",
    "Website URL": "",
    "Venue Name": "St. Edward&#039;s s s Bukuumi",
    "Event Timezone": "Africa/Kampala",
    _host_coordinates: "",
    _host_country_name: "",
  },
  {
    id: 12580471,
    slug: "student-club-rcc-institute-of-information-technology",
    status: "wcpt-closed",
    link: "https://central.wordcamp.org/wordcamps/student-club-rcc-institute-of-information-technology/",
    title: {
      rendered:
        "WordPress Student Club RCC Institute of Information Technology",
    },
    "Start Date (YYYY-mm-dd)": "",
    "End Date (YYYY-mm-dd)": "",
    Location: "",
    URL: "",
    "Website URL": "",
    "Venue Name": "",
    "Event Timezone": "",
    _host_coordinates: "",
    _host_country_name: "",
  },
];

export const [
  upcomingRecord,
  pastRecord,
  namedEntityTitleRecord,
  numericEntityTitleRecord,
  datelessRecord,
] = wordCampRecords;
