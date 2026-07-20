// Stub for non-code asset imports (images) under Jest.
//
// Components import PNG/SVG assets — Leaflet's marker icons, for one — for their
// bundled URL. Jest cannot parse a binary file as a module, so it maps them
// here to a plain string standing in for the URL the bundler would produce.
module.exports = "test-file-stub";
