import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Page header: title, one-line provenance, theme toggle.
 *
 * The subtitle names the data source rather than describing the app — a
 * visitor's first question about a schedule is where the data came from.
 */
export function AppHeader() {
  return (
    <header className="mb-8 flex items-start justify-between gap-4 border-b border-border pb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          WordCamp Schedule Viewer
        </h1>
        <p className="mt-1 text-muted-foreground">
          Upcoming and past WordCamps, live from the WordCamp Central REST API.
        </p>
      </div>

      <ThemeToggle />
    </header>
  );
}
