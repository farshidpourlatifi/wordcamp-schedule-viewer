/**
 * Jest setup — runs once per test file, after the environment is ready.
 */

// Adds DOM-aware matchers: toBeInTheDocument, toHaveAccessibleName, etc.
import "@testing-library/jest-dom";

// Tests must never touch the network. Any component or hook that reaches for a
// bare global fetch instead of the injected one will fail loudly here rather
// than silently hitting the live WordCamp API (slow, flaky, and rate-limited).
global.fetch = jest.fn(() => {
  throw new Error(
    "Unexpected global fetch in a test — inject a fetch implementation instead.",
  );
});
