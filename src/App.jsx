import { useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { ListView } from "@/components/ListView";
import { MonthCalendar } from "@/components/MonthCalendar";
import { LoadingState, ErrorState } from "@/components/states";
import {
  ViewToggle,
  VIEW_CALENDAR,
  VIEW_LIST,
  readStoredView,
  persistView,
} from "@/components/ViewToggle";
import { Tabs, TabsList, Tab, TabPanel } from "@/components/ui/tabs";
import { useWordCamps } from "@/hooks/useWordCamps";

/**
 * Application shell: header, the schedule in the chosen view, footer.
 *
 * All data concerns live in `useWordCamps`; this component only decides which
 * of the four states to render, and which view renders the camps.
 *
 * The upcoming/past tabs belong to the list, not to the calendar. A calendar
 * is continuous time and already marks today, so splitting it in two makes
 * the same month render twice with different subsets — July shows the camps
 * before the 20th under one tab and the ones after it under another. The tabs
 * are a filter, and a filter belongs to the view that needs filtering.
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
        {isLoading && <LoadingState />}

        {isError && <ErrorState error={error} onRetry={refetch} />}

        {!isLoading && !isError && view === VIEW_CALENDAR && (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-end gap-3">
              <ViewToggle view={view} onViewChange={changeView} />
            </div>

            <MonthCalendar camps={camps} emptyMessage="No WordCamps found." />
          </>
        )}

        {!isLoading && !isError && view === VIEW_LIST && (
          <Tabs defaultValue={TAB_UPCOMING}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <Tab value={TAB_UPCOMING}>Upcoming ({upcoming.length})</Tab>
                <Tab value={TAB_PAST}>Past ({past.length})</Tab>
              </TabsList>

              <ViewToggle view={view} onViewChange={changeView} />
            </div>

            <TabPanel value={TAB_UPCOMING}>
              <ListView
                camps={upcoming}
                emptyMessage="No upcoming WordCamps with scheduled dates."
                revealLabel="Show later"
              />
            </TabPanel>

            <TabPanel value={TAB_PAST}>
              <ListView
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
