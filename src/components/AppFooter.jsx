import { WORDCAMPS_ENDPOINT } from "@/api/wordcamps";

/**
 * Footer crediting the data source.
 *
 * The endpoint is imported rather than retyped, so the link cannot drift away
 * from the URL the app actually calls.
 */
export function AppFooter() {
  return (
    <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
      <p>
        Data from{" "}
        <a
          href={WORDCAMPS_ENDPOINT}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-primary"
        >
          WordCamp Central
        </a>
        , the official WordPress event directory.
      </p>
    </footer>
  );
}
