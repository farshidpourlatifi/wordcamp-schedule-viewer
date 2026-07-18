import { Card } from "@/components/ui/card";
import { formatCampDate } from "@/utils/formatDate";

/**
 * One WordCamp.
 *
 * Renders a normalized camp — it never touches an API field name, and the
 * title arrives as decoded plain text from the normalizer, so it goes in as
 * React children (escaped) and never through dangerouslySetInnerHTML.
 *
 * @param {Object} props
 * @param {import("@/utils/normalizeWordCamp").WordCamp} props.camp
 */
export function WordCampCard({ camp }) {
  const { title, url, startDate, location } = camp;

  return (
    <Card
      as="article"
      className="flex flex-col gap-1.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-sm font-bold text-primary">
        {formatCampDate(startDate)}
      </p>

      <h3 className="text-base font-semibold leading-tight">
        {url ? (
          <a
            href={url}
            target="_blank"
            // noopener stops the opened page reaching back via window.opener;
            // noreferrer withholds the referrer. Required on every external
            // link in this app.
            rel="noopener noreferrer"
            className="transition-colors hover:text-primary"
          >
            {title}
          </a>
        ) : (
          // The normalizer blanks unsafe or missing URLs, so a camp can
          // legitimately have no link. Render the title as plain text rather
          // than an anchor to nowhere.
          title
        )}
      </h3>

      {/* Hidden entirely when absent — an empty metadata line reads as a bug. */}
      {location && <p className="text-sm text-muted-foreground">{location}</p>}
    </Card>
  );
}
