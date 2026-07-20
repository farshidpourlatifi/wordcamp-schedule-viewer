import { useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { ListView } from "@/components/ListView";
import { MonthCalendar } from "@/components/MonthCalendar";
import { LoadingState, ErrorState } from "@/components/states";
import {
  ViewToggle,
  VIEW_CALENDAR,
  readStoredView,
  persistView,
} from "@/components/ViewToggle";
import { Tabs, TabsList, Tab, TabPanel } from "@/components/ui/tabs";
import { useWordCamps } from "@/hooks/useWordCamps";

/**
 * Application shell: header, upcoming/past tabs over the schedule, footer.
 *
 * All data concerns live in `useWordCamps`; this component only decides which
 * of the four states to render, and which view renders the camps.
 */

const TAB_UPCOMING = "upcoming";
const TAB_PAST = "past";

export function App() {
  const { upcoming, past, isLoading, isError, error, refetch } = useWordCamps();

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

        {!isLoading && !isError && (
          <Tabs defaultValue={TAB_UPCOMING}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <Tab value={TAB_UPCOMING}>Upcoming ({upcoming.length})</Tab>
                <Tab value={TAB_PAST}>Past ({past.length})</Tab>
              </TabsList>

              <ViewToggle view={view} onViewChange={changeView} />
            </div>

            <TabPanel value={TAB_UPCOMING}>
              <ScheduleView
                view={view}
                camps={upcoming}
                emptyMessage="No upcoming WordCamps with scheduled dates."
                revealLabel="Show later"
              />
            </TabPanel>

            <TabPanel value={TAB_PAST}>
              <ScheduleView
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
 * Render camps in the chosen view.
 *
 * Both tab panels need this branch, so it lives in one place — otherwise the
 * two panels would drift the moment either view gains a prop.
 *
 * @param {Object} props
 * @param {string} props.view
 * @param {Array} props.camps
 * @param {string} props.emptyMessage
 * @param {string} props.revealLabel List view only; the calendar pages by month.
 */
function ScheduleView({ view, camps, emptyMessage, revealLabel }) {
  if (view === VIEW_CALENDAR) {
    return <MonthCalendar camps={camps} emptyMessage={emptyMessage} />;
  }

  return (
    <ListView
      camps={camps}
      emptyMessage={emptyMessage}
      revealLabel={revealLabel}
    />
  );
}
