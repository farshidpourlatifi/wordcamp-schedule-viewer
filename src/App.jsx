/**
 * Application shell.
 *
 * Phase 1 placeholder: proves the toolchain end to end (JSX -> Babel ->
 * webpack, Tailwind tokens, dev server). The real header, tabs, and calendar
 * view arrive in Phase 4.
 */
export function App() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">
        WordCamp Schedule Viewer
      </h1>
      <p className="mt-2 text-muted-foreground">
        Upcoming and past WordCamps, loaded live from the WordCamp Central
        WordPress REST API.
      </p>
    </main>
  );
}
