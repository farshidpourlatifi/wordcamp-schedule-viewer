// StrykerJS mutation testing — hand-written config.
//
// Coverage says which lines ran; mutation testing says whether the tests would
// NOTICE a bug on those lines. Stryker changes the code in small ways (flips a
// `>` to `>=`, a `&&` to `||`, a return value to null) and re-runs the suite:
// a mutant "killed" by a failing test is a line the tests genuinely guard, a
// mutant that "survives" is a line they only execute.
//
// Scope is deliberately the two PURE layers — utils and api. Their mutants are
// fast and honest: a flipped comparison in date math is a real, catchable bug.
// Component mutants (a dropped className, a changed aria string) are slow to
// run and mostly noise against tests that assert behaviour, not markup, so the
// UI is left out rather than padding the score with mutants nobody should kill.
//
// This is advisory and NOT in the blocking CI path. Run it with
// `npm run test:mutation`.

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: "jest",

  // Reuse the project's Jest setup verbatim, so mutants are tested exactly the
  // way the real suite runs — same jsdom env, same module aliases, same fetch
  // tripwire.
  jest: {
    projectType: "custom",
    configFile: "jest.config.js",
  },

  // Only the pure layers are mutated. Test files are excluded — mutating a test
  // is meaningless — as are fixtures.
  mutate: [
    "src/utils/**/*.js",
    "src/api/**/*.js",
    "!src/**/*.test.js",
    "!src/test/**",
  ],

  // Run only the tests that covered a given line against that line's mutants,
  // rather than the whole suite per mutant. The big speed win for a scoped run.
  coverageAnalysis: "perTest",

  reporters: ["html", "clear-text", "progress"],
  htmlReporter: { fileName: "reports/mutation/index.html" },

  // The plan's target. `break` fails the command below the floor, so the score
  // is enforced the same way the coverage floor is — not left to a reader.
  thresholds: {
    high: 90,
    low: 85,
    break: 85,
  },
};
