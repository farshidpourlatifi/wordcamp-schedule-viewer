import { lazy, Suspense, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
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
import { useWordCamps } from "@/hooks/useWordCamps";

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
  const { camps, upcoming, past, isLoading, isError, error, refetch } =
    useWordCamps();

  // The view lives here rather than in each panel: it is a mode, and it
  // should survive switching between Upcoming and Past.
  const [view, setView] = useState(readStoredView);

  const changeView = (next) => {
    persistView(next);
    setView(next);
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <AppHeader />

      <main>
        {isLoading && <LoadingState calendar={view === VIEW_CALENDAR} />}

        {isError && <ErrorState error={error} onRetry={refetch} />}

        {!isLoading && !isError && view === VIEW_CALENDAR && (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-end gap-3">
              <ViewToggle view={view} onViewChange={changeView} />
            </div>

            <MonthCalendar camps={camps} emptyMessage="No WordCamps found." />
          </>
        )}

        {!isLoading && !isError && view !== VIEW_CALENDAR && (
          <Tabs defaultValue={TAB_UPCOMING}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <Tab value={TAB_UPCOMING}>Upcoming ({upcoming.length})</Tab>
                <Tab value={TAB_PAST}>Past ({past.length})</Tab>
              </TabsList>

              <ViewToggle view={view} onViewChange={changeView} />
            </div>

            <TabPanel value={TAB_UPCOMING}>
              <TabbedView
                view={view}
                camps={upcoming}
                emptyMessage="No upcoming WordCamps found."
                revealLabel="Show later"
              />
            </TabPanel>

            <TabPanel value={TAB_PAST}>
              <TabbedView
                view={view}
                camps={past}
                emptyMessage="No past WordCamps found."
                revealLabel="Show earlier"
              />
            </TabPanel>
          </Tabs>
        )}
      </main>

      <AppFooter />
    </div>
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
