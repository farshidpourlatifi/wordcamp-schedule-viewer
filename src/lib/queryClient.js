import { QueryClient } from "@tanstack/react-query";

/** One minute in milliseconds — the unit the tuning below is expressed in. */
const MINUTE = 60 * 1000;

/**
 * Create the app's QueryClient.
 *
 * A factory rather than a shared singleton: a module-level client is a global
 * cache, so tests would leak fetched data between cases and one suite could
 * answer another's query from cache.
 *
 * The defaults are tuned for this data. WordCamp records change on the order
 * of days, and a full load is ~15 requests / ~4s, so refetching eagerly costs
 * a lot and gains nothing.
 *
 * @returns {QueryClient}
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Within this window, switching tabs reads from cache instead of
        // re-running a 15-request page walk.
        staleTime: 5 * MINUTE,
        gcTime: 30 * MINUTE,
        // A view-only schedule does not need to re-fetch every time the
        // window regains focus; the data is not live.
        refetchOnWindowFocus: false,
        // One retry covers a transient blip without making a genuine outage
        // take three timeouts to surface as an error state.
        retry: 1,
      },
    },
  });
}
