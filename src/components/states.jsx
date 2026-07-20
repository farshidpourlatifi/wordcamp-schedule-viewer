import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DAYS_PER_WEEK, WEEKS_PER_GRID } from "@/utils/calendarGrid";

/**
 * Loading and error states.
 *
 * Both are first-class UI, not afterthoughts: a full load walks 15 API pages
 * and takes several seconds, so what shows during and after a failure is a
 * large share of the app's real-world appearance.
 */

/** Skeleton cards shown while the first load is in flight. */
const SKELETON_CARD_COUNT = 6;

/**
 * Loading placeholder.
 *
 * Skeleton shapes rather than a spinner, so the layout does not jump when the
 * real content lands. The region is a live region carrying real text — the
 * shapes themselves are aria-hidden, so assistive tech hears "Loading
 * WordCamps…" instead of nothing.
 *
 * The shape follows the view being loaded into. A card skeleton standing in
 * for the calendar table cost 0.36 CLS on the deployed build: the table is
 * several times taller, so everything below it jumped when the data arrived.
 *
 * @param {Object} props
 * @param {boolean} [props.calendar] Reserve the month grid's shape instead.
 */
export function LoadingState({ calendar = false }) {
  if (calendar) return <CalendarSkeleton />;

  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading WordCamps…</span>

      <Skeleton className="mb-3 h-4 w-32" />

      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <Card key={index} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-20" />
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading placeholder shaped like the month grid.
 *
 * Reserves the real table's geometry — nav row, seven columns, six rows of
 * `h-24` cells — so the calendar drops into space already held for it.
 */
function CalendarSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading WordCamps…</span>

      <div className="mb-4 flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-9" />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[44rem]">
          <div className="grid grid-cols-7">
            {Array.from({ length: DAYS_PER_WEEK }, (_, index) => (
              <div
                key={index}
                className="border border-border p-2"
                aria-hidden="true"
              >
                <Skeleton className="mx-auto h-3 w-8" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from(
              { length: WEEKS_PER_GRID * DAYS_PER_WEEK },
              (_, index) => (
                <div
                  key={index}
                  className="h-24 border border-border p-1"
                  aria-hidden="true"
                >
                  <Skeleton className="h-3 w-4" />
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Error callout.
 *
 * `role="alert"` so it is announced when it replaces the loading state. Shows
 * a plain-language sentence AND the underlying reason: the plain sentence is
 * for the visitor, the reason is what makes a bug report useful.
 *
 * @param {Object} props
 * @param {Error|null} [props.error]
 * @param {Function} [props.onRetry]
 */
export function ErrorState({ error, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive p-6 text-destructive"
    >
      <p className="font-semibold">Could not load WordCamps.</p>

      <p className="mt-1 text-sm">
        The WordCamp Central API did not respond as expected. It may be
        temporarily unavailable — trying again often works.
      </p>

      {error?.message && (
        <p className="mt-3 font-mono text-xs opacity-80">{error.message}</p>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md border border-destructive px-4 py-2 text-sm font-medium transition-colors hover:bg-destructive hover:text-background"
        >
          Try again
        </button>
      )}
    </div>
  );
}
