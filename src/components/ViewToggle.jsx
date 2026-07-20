import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * Switch between the calendar, list, and map views.
 *
 * Three ways to read the same list, split by the question each answers: the
 * calendar "when", the list "what has there been", the map "where". Which one
 * you want depends on the task, so the choice is a persisted mode rather than a
 * per-tab setting.
 *
 * Persistence follows ThemeToggle: a try/catch helper, because localStorage
 * throws in private-mode and blocked-cookie contexts and a view preference is
 * not worth breaking the page over.
 */

export const VIEW_CALENDAR = "calendar";
export const VIEW_LIST = "list";
export const VIEW_MAP = "map";

const VIEWS = [VIEW_CALENDAR, VIEW_LIST, VIEW_MAP];

const STORAGE_KEY = "schedule-view";

/**
 * Read the stored view, defaulting to the calendar.
 *
 * The calendar is the default because the assignment makes it the required
 * primary view. Anything unrecognized in storage — a stale value, a hand-edit
 * — falls back rather than rendering nothing.
 *
 * @returns {string} One of the VIEW_* constants.
 */
export function readStoredView() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    return VIEWS.includes(stored) ? stored : VIEW_CALENDAR;
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
  { value: VIEW_MAP, label: "Map" },
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
