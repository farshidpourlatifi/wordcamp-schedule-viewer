import { cn } from "@/lib/cn";

/**
 * Button.
 *
 * A real `<button>` with an explicit type, not a clickable div: keyboard
 * activation, focus order and the button role all come for free and cannot
 * drift out of sync with the styling.
 *
 * Two variants are enough for this app (KISS) — a bordered default and a
 * borderless icon button for the theme toggle.
 *
 * @param {Object} props
 * @param {"default"|"ghost"} [props.variant]
 * @param {string} [props.className]
 * @param {string} [props.type] Defaults to "button" so it never submits a form.
 */
export function Button({
  variant = "default",
  className,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        // Focus ring is global (see globals.css :focus-visible), so it stays
        // consistent across every interactive element rather than per-component.
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "default" &&
          "border border-border bg-card px-4 py-2 hover:bg-accent hover:text-accent-foreground",
        variant === "ghost" &&
          "p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}
