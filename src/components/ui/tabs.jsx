import { Tabs as BaseTabs } from "@base-ui/react/tabs";

import { cn } from "@/lib/cn";

/**
 * Pill-style tabs, built on Base UI.
 *
 * The headless primitive is doing real work here: roles (`tablist`/`tab`/
 * `tabpanel`), `aria-selected`, arrow-key navigation and roving tabindex are
 * the parts of a tab widget that are easy to get subtly wrong by hand. This
 * module only adds token styling on top.
 *
 * Base UI marks the active tab with `data-active`, so the active styles are
 * driven by the primitive's own state rather than a parallel prop this file
 * would have to keep in sync.
 */

export const Tabs = BaseTabs.Root;

export function TabsList({ className, ...props }) {
  return (
    <BaseTabs.List
      className={cn("inline-flex gap-1 rounded-full bg-muted p-1", className)}
      {...props}
    />
  );
}

export function Tab({ className, ...props }) {
  return (
    <BaseTabs.Tab
      className={cn(
        "cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        "text-muted-foreground hover:text-foreground",
        "data-[active]:bg-card data-[active]:text-foreground data-[active]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function TabPanel({ className, ...props }) {
  return (
    <BaseTabs.Panel
      className={cn(
        "mt-6",
        // Base UI keeps a deactivated panel mounted while it "animates out",
        // marking it `data-ending-style` and waiting for the transition to
        // finish. This app has no panel animation, so that wait never ends and
        // BOTH panels stay visible at once. Hiding the exiting panel outright
        // is the fix; `hidden` covers the settled state.
        "data-[ending-style]:hidden [&[hidden]]:hidden",
        className,
      )}
      {...props}
    />
  );
}
