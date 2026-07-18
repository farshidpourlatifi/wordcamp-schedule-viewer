import { QueryClient } from "@tanstack/react-query";

import { createQueryClient } from "@/lib/queryClient";

describe("createQueryClient", () => {
  it("returns a QueryClient configured for slow-moving data", () => {
    const defaults = createQueryClient().getDefaultOptions().queries;

    expect(defaults.staleTime).toBe(300000);
    expect(defaults.refetchOnWindowFocus).toBe(false);
    expect(defaults.retry).toBe(1);
  });

  it("returns a new client per call", () => {
    // A shared singleton would be a global cache: tests would leak fetched
    // data between cases and one suite could answer another's query.
    const first = createQueryClient();
    const second = createQueryClient();

    expect(first).toBeInstanceOf(QueryClient);
    expect(first).not.toBe(second);
  });
});
