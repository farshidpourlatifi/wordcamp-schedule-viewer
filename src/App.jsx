import { lazy, Suspense, useEffect, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { Filters } from "@/components/Filters";
import { ListView } from "@/components/ListView";
import { MonthCalendar } from "@/components/MonthCalendar";
import { LoadingState, ErrorState } from "@/components/states";
import {
  ViewToggle,
  VIEW_CALENDAR,
  VIEW_MAP,
  readStoredView,
  persistView,
} from "@/components/ViewToggle";
import { Tabs, TabsList, Tab, TabPanel } from "@/components/ui/tabs";
import { useCampFilters } from "@/hooks/useCampFilters";
import { useWordCamps } from "@/hooks/useWordCamps";
import { ALL_REGIONS } from "@/utils/filterCamps";

// The map pulls in Leaflet and its cluster plugin — ~150 KiB that the calendar
// and list never touch. Loading it only when the map is opened keeps the two
// primary views off that weight; webpack splits it into its own chunk.
const MapView = lazy(() =>
  import("@/components/MapView").then((module) => ({
    default: module.MapView,
  })),
);

/**
 * Application shell: header, the schedule in the chosen view, footer.
 *
 * All data concerns live in `useWordCamps`; this component only decides which
 * of the four states to render, and which view renders the camps.
 *
 * The upcoming/past tabs belong to the list and the map, not to the calendar.
 * A calendar is continuous time and already marks today, so splitting it in
 * two makes the same month render twice with different subsets. The tabs are a
 * filter, and they belong to the views that filter — the list and the map each
 * read one already-split side at a time.
 */

const TAB_UPCOMING = "upcoming";
const TAB_PAST = "past";

export function App() {
  const {
    camps,
    upcoming,
    past,
    totalCount,
    isLoading,
    isArchiveLoading,
    isArchiveLoaded,
    requestArchive,
    isError,
    error,
    refetch,
  } = useWordCamps();

  // The view lives here rather than in each panel: it is a mode, and it
  // should survive switching between Upcoming and Past.
  const [view, setView] = useState(readStoredView);

  const filters = useCampFilters(camps, upcoming, past);

  // The calendar shows the whole timeline, so it needs the past archive.
  // Requesting it here covers both switching to the calendar and landing on
  // it as the stored view; requestArchive is idempotent.
  useEffect(() => {
    if (view === VIEW_CALENDAR) requestArchive();
  }, [view, requestArchive]);

  const changeView = (next) => {
    persistView(next);
    setView(next);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <AppHeader />

      <main>
        {isLoading && (
          <LoadingState
            calendar={view === VIEW_CALENDAR}
            map={view === VIEW_MAP}
          />
        )}

        {isError && <ErrorState error={error} onRetry={refetch} />}

        {!isLoading && !isError && (
          <LoadedSchedule
            view={view}
            onViewChange={changeView}
            totalCount={totalCount}
            isArchiveLoading={isArchiveLoading}
            isArchiveLoaded={isArchiveLoaded}
            onNeedArchive={requestArchive}
            filters={filters}
          />
        )}
      </main>

      <AppFooter />
    </div>
  );
}

/**
 * The schedule once data has loaded: the filter row, then the chosen view.
 *
 * Split out of App so the shell stays a plain loading/error/ready switch and
 * this piece owns the view branching under the complexity cap.
 *
 * @param {Object} props
 * @param {string} props.view
 * @param {(view: string) => void} props.onViewChange
 * @param {number} props.totalCount Total across the whole feed, from the header.
 * @param {boolean} props.isArchiveLoading The past archive is still streaming.
 * @param {boolean} props.isArchiveLoaded The past archive has loaded.
 * @param {() => void} props.onNeedArchive Load the past archive on demand.
 * @param {ReturnType<typeof useCampFilters>} props.filters
 */
function LoadedSchedule({
  view,
  onViewChange,
  totalCount,
  isArchiveLoading,
  isArchiveLoaded,
  onNeedArchive,
  filters,
}) {
  const {
    query,
    setQuery,
    region,
    setRegion,
    isFiltering,
    shownCamps,
    shownUpcoming,
    shownPast,
  } = filters;

  // Before the archive loads, the Past count is not known from records — but
  // the header total minus upcoming gives it exactly (both unfiltered). Once
  // the archive is in, the real filtered count takes over.
  const pastCount = isArchiveLoaded
    ? shownPast.length
    : Math.max(totalCount - shownUpcoming.length, 0);

  // Filtering and the Past tab both reach into past events, which live in the
  // lazily-loaded archive — so touching either pulls it in.
  const search = (value) => {
    if (value.trim() !== "") onNeedArchive();
    setQuery(value);
  };
  const filterRegion = (value) => {
    if (value !== ALL_REGIONS) onNeedArchive();
    setRegion(value);
  };
  const onTabChange = (value) => {
    if (value === TAB_PAST) onNeedArchive();
  };

  // When a filter is active but a view is empty, say so — otherwise the
  // "no WordCamps" copy reads as if the data failed to load. The past side gets
  // a loading message while its archive is still in flight.
  const emptyFor = (base) =>
    isFiltering ? "No WordCamps match your search." : base;
  const pastEmpty = isArchiveLoading
    ? "Loading the full archive…"
    : emptyFor("No past WordCamps found.");

  return (
    <>
      <Filters
        query={query}
        onQueryChange={search}
        region={region}
        onRegionChange={filterRegion}
        resultCount={shownCamps.length}
        totalCount={totalCount}
      />

      {isArchiveLoading && (
        // The upcoming feed is already on screen; this notes the past archive
        // is still arriving, so the Past count settling upward reads as loading
        // rather than a glitch.
        <p role="status" className="mb-4 text-sm text-muted-foreground">
          Loading the full archive…
        </p>
      )}

      {view === VIEW_CALENDAR ? (
        <>
          <div className="mb-2 flex flex-wrap items-center justify-end gap-3">
            <ViewToggle view={view} onViewChange={onViewChange} />
          </div>

          <MonthCalendar
            camps={shownCamps}
            emptyMessage={emptyFor("No WordCamps found.")}
          />
        </>
      ) : (
        <Tabs defaultValue={TAB_UPCOMING} onValueChange={onTabChange}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <Tab value={TAB_UPCOMING}>Upcoming ({shownUpcoming.length})</Tab>
              <Tab value={TAB_PAST}>Past ({pastCount})</Tab>
            </TabsList>

            <ViewToggle view={view} onViewChange={onViewChange} />
          </div>

          <TabPanel value={TAB_UPCOMING}>
            <TabbedView
              view={view}
              camps={shownUpcoming}
              emptyMessage={emptyFor("No upcoming WordCamps found.")}
              revealLabel="Show later"
            />
          </TabPanel>

          <TabPanel value={TAB_PAST}>
            <TabbedView
              view={view}
              camps={shownPast}
              emptyMessage={pastEmpty}
              revealLabel="Show earlier"
            />
          </TabPanel>
        </Tabs>
      )}
    </>
  );
}

/**
 * Render one tab's camps in whichever of the tabbed views is active.
 *
 * Both tab panels render this, so the list/map choice lives in one place
 * rather than being duplicated — and doubled again — across the two panels.
 *
 * @param {Object} props
 * @param {string} props.view The active view (list or map).
 * @param {Array} props.camps This tab's camps.
 * @param {string} props.emptyMessage
 * @param {string} props.revealLabel List only; the map has no reveal control.
 */
function TabbedView({ view, camps, emptyMessage, revealLabel }) {
  if (view === VIEW_MAP) {
    return (
      <Suspense fallback={<MapLoading />}>
        <MapView camps={camps} emptyMessage={emptyMessage} />
      </Suspense>
    );
  }

  return (
    <ListView
      camps={camps}
      emptyMessage={emptyMessage}
      revealLabel={revealLabel}
    />
  );
}

/**
 * Placeholder while the lazily-loaded map chunk arrives. Sized to the map so
 * the swap does not shift the page.
 */
function MapLoading() {
  return (
    <div
      role="status"
      className="flex h-[70vh] min-h-80 items-center justify-center rounded-lg border border-border text-muted-foreground"
    >
      <span>Loading map…</span>
    </div>
  );
}
