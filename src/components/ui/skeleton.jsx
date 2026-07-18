import { cn } from "@/lib/cn";

/**
 * Placeholder block for loading states.
 *
 * A skeleton rather than a spinner: it reserves the space the real content
 * will occupy, so the page does not jump when ~1,500 records finish loading.
 *
 * Always decorative — the surrounding region carries the `role="status"` and
 * the text an assistive-tech user actually needs, and these blocks are hidden
 * from it.
 *
 * @param {Object} props
 * @param {string} [props.className]
 */
export function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
