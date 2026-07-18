import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { CalendarView } from "@/components/CalendarView";
import { LoadingState, ErrorState } from "@/components/states";
import { Tabs, TabsList, Tab, TabPanel } from "@/components/ui/tabs";
import { useWordCamps } from "@/hooks/useWordCamps";

/**
 * Application shell: header, upcoming/past tabs over the calendar view, footer.
 *
 * All data concerns live in `useWordCamps`; this component only decides which
 * of the four states to render.
 */

const TAB_UPCOMING = "upcoming";
const TAB_PAST = "past";

export function App() {
  const { upcoming, past, isLoading, isError, error, refetch } = useWordCamps();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <AppHeader />

      <main>
        {isLoading && <LoadingState />}

        {isError && <ErrorState error={error} onRetry={refetch} />}

        {!isLoading && !isError && (
          <Tabs defaultValue={TAB_UPCOMING}>
            <TabsList>
              <Tab value={TAB_UPCOMING}>Upcoming ({upcoming.length})</Tab>
              <Tab value={TAB_PAST}>Past ({past.length})</Tab>
            </TabsList>

            <TabPanel value={TAB_UPCOMING}>
              <CalendarView
                camps={upcoming}
                emptyMessage="No upcoming WordCamps with scheduled dates."
                revealLabel="Show later"
              />
            </TabPanel>

            <TabPanel value={TAB_PAST}>
              <CalendarView
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
