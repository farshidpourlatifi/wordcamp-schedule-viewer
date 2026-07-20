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

/** Where the app opens when nothing is stored. */
const DEFAULT_VIEW = VIEW_LIST;

const STORAGE_KEY = "schedule-view";

/**
 * Read the stored view, defaulting to the list.
 *
 * The list is the default: its Upcoming tab needs only the fast scheduled feed,
 * so the app is interactive before the ~4 MB past archive loads. The calendar
 * (still required and one click away) needs the whole timeline, so landing
 * there would force that archive up front — the opposite of the lazy load.
 * Anything unrecognized in storage falls back rather than rendering nothing.
 *
 * @returns {string} One of the VIEW_* constants.
 */
export function readStoredView() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    return VIEWS.includes(stored) ? stored : DEFAULT_VIEW;
  } catch {
    return DEFAULT_VIEW;
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
