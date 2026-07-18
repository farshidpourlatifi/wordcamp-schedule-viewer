import { cn } from "@/lib/cn";

/**
 * Card surface.
 *
 * A plain token-styled element — no headless primitive needed, since a card
 * has no behaviour. `className` is merged rather than replaced, so callers can
 * override padding or layout without losing the surface styling.
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @param {React.ElementType} [props.as] Element to render; defaults to div.
 */
export function Card({ className, as: Component = "div", ...props }) {
  return (
    <Component
      className={cn(
        "rounded-lg border border-border bg-card p-4 text-card-foreground",
        className,
      )}
      {...props}
    />
  );
}
