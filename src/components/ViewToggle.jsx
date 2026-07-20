import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Switch between the calendar and list views.
 *
 * The two views split the work by data density rather than duplicating each
 * other: the calendar answers "what is on this day" for a single month, the
 * list scans ~219 months of history in one scroll. Which one you want depends
 * on the tab and the task, so the choice is a persisted mode rather than a
 * per-tab setting.
 *
 * Persistence follows ThemeToggle: a try/catch helper, because localStorage
 * throws in private-mode and blocked-cookie contexts and a view preference is
 * not worth breaking the page over.
 */

export const VIEW_CALENDAR = "calendar";
export const VIEW_LIST = "list";

const STORAGE_KEY = "schedule-view";

/**
 * Read the stored view, defaulting to the calendar.
 *
 * The calendar is the default because the assignment makes it the required
 * primary view. Anything unrecognized in storage — a stale value, a hand-edit
 * — falls back rather than rendering nothing.
 *
 * @returns {string} VIEW_CALENDAR or VIEW_LIST.
 */
export function readStoredView() {
  try {
    return localStorage.getItem(STORAGE_KEY) === VIEW_LIST
      ? VIEW_LIST
      : VIEW_CALENDAR;
  } catch {
    return VIEW_CALENDAR;
  }
}

/**
 * Persist the choice, ignoring storage failures.
 *
 * @param {string} view
 */
export function persistView(view) {
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    // Ignored deliberately; see above.
  }
}

const OPTIONS = [
  { value: VIEW_CALENDAR, label: "Calendar" },
  { value: VIEW_LIST, label: "List" },
];

/**
 * @param {Object} props
 * @param {string} props.view Currently active view.
 * @param {(view: string) => void} props.onViewChange
 */
export function ViewToggle({ view, onViewChange }) {
  return (
    // A group of pressed-state buttons rather than ThemeToggle's single
    // action-labelled button: with two visible options, "which one is on" is
    // the thing a screen-reader user needs, and aria-pressed says it directly.
    <div
      role="group"
      aria-label="Schedule view"
      className="inline-flex gap-1 rounded-full bg-muted p-1"
    >
      {OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant="ghost"
          aria-pressed={view === option.value}
          onClick={() => onViewChange(option.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium",
            view === option.value &&
              "bg-card text-foreground shadow-sm hover:bg-card",
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
