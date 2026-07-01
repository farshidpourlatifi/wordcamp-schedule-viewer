# Claude Design Prompt — Generate the Visual Design-System Sheet

Paste the prompt below into **Claude Design** (design mode). It produces a single
visual design-system artifact — a one-page gallery you can eyeball and refine.
After you're happy with it, use the reconciliation step at the bottom to fold any
changes back into `.claude/skills/wordcamp-design-system/SKILL.md` and the code
tokens so design and code stay in sync.

> Why a sheet, not screens: this step locks the *vocabulary* (color, type,
> spacing, component states). Screen mockups come after, built from this.

---

## PROMPT — copy everything in this block

> Create a **design-system reference sheet** for a small, content-forward,
> view-only React web app called **"WordCamp Schedule Viewer"** (it lists
> upcoming and past WordCamp events in a calendar layout). This is a developer's
> portfolio piece reviewed by a senior engineer, so the aesthetic should read as
> **calm, professional, precise, and restrained** — not flashy. Think clean SaaS
> dashboard, generous whitespace, one confident accent.
>
> Output a **single artifact**: one vertical page that presents the whole design
> system as a gallery (like a mini Figma style page). Show it in **both light and
> dark modes** (side by side, or a light sheet with a dark strip). Use this exact
> shadcn-style **OKLCH** token theme as the foundation (neutral zinc grays with a
> blue `--primary`). Reference tokens by semantic name, not raw color:
>
> **Light (`:root`)**
> - `--background` oklch(1 0 0), `--foreground` oklch(0.141 0.005 285.823)
> - `--card` oklch(1 0 0), `--card-foreground` oklch(0.141 0.005 285.823)
> - `--primary` oklch(0.5 0.134 242.749) (blue accent), `--primary-foreground` oklch(0.977 0.013 236.62)
> - `--muted` oklch(0.967 0.001 286.375), `--muted-foreground` oklch(0.552 0.016 285.938)
> - `--border`/`--input` oklch(0.92 0.004 286.32), `--ring` oklch(0.705 0.015 286.067)
> - `--destructive` oklch(0.577 0.245 27.325); `--radius` 0.625rem
>
> **Dark (`.dark`)**
> - `--background` oklch(0.141 0.005 285.823), `--foreground` oklch(0.985 0 0)
> - `--card` oklch(0.21 0.006 285.885), `--card-foreground` oklch(0.985 0 0)
> - `--primary` oklch(0.443 0.11 240.79), `--primary-foreground` oklch(0.977 0.013 236.62)
> - `--muted` oklch(0.274 0.006 286.033), `--muted-foreground` oklch(0.705 0.015 286.067)
> - `--border` oklch(1 0 0 / 10%), `--input` oklch(1 0 0 / 15%), `--ring` oklch(0.552 0.016 285.938)
> - `--destructive` oklch(0.704 0.191 22.216)
>
> (Do NOT include sidebar or chart tokens — this app has neither.)
>
> **Type:** Inter (system-ui fallback). h1 2rem/700; section labels 0.85rem/700
> uppercase, letter-spacing; card titles 1rem/600; body 1rem/400; meta 0.85rem.
> Left-aligned, line-height ~1.5 body / 1.2 headings.
>
> **Shape/space:** 4px spacing scale; card radius from `--radius`; pill/tab radius
> 999px; no shadow at rest, soft shadow on card hover only.
>
> The sheet must include, each shown as a real rendered example with a label,
> **in both light and dark**:
> 1. **Color palette** — swatches with token name + intended use (both modes).
> 2. **Typographic scale** — each level rendered with its spec.
> 3. **Spacing & radius** — a small scale reference.
> 4. **Buttons** — primary, secondary/ghost, with hover and focus-visible states.
> 5. **Tabs** — a pill segmented "Upcoming / Past" control, active vs inactive.
> 6. **Theme toggle** — a small light/dark switch control.
> 7. **WordCampCard** — card with a linked title (`foreground`→`primary` on hover),
>    a `primary` bold date line (e.g. "Sat, 14 Mar 2026"), and a `muted-foreground`
>    location line; show a normal card and one with a missing date ("Date TBD") and
>    no location.
> 8. **Calendar section** — an uppercase `primary` month label ("March 2026") with a
>    `border` hairline rule beneath, then a responsive grid of 2–3 cards.
> 9. **States** — loading (skeleton cards, NOT a spinner), empty (a calm
>    `muted-foreground` sentence), and error (a `destructive` callout with a
>    plain-language message).
>
> Constraints: use ONLY these tokens — one accent (`--primary`), no gradients, no
> decorative illustration, no second accent. Everything must meet WCAG AA contrast
> **in both modes** (foreground and muted-foreground on background; primary-
> foreground on the primary fill). Show visible `--ring` focus rings on
> interactive elements. Keep it tasteful and minimal.
>
> Deliver it as a self-contained artifact I can review, and give it a title
> header "WordCamp Schedule Viewer — Design System".

---

## Optional refinement follow-ups (say these to Claude Design after the first pass)

- "Tighten the card — reduce padding slightly and make the date line the clear
  second-most prominent element after the title."
- "Show the tabs' keyboard focus state explicitly."
- "Add a dark-on-light 'upcoming' vs muted 'past' visual distinction for cards,
  without adding a new accent color."
- "Export/give me the final color + type tokens as a plain list so I can copy
  them into code."

---

## Reconcile back into the repo (do this after you like the sheet)

The visual sheet is the reference; the code must match it. When the design is
final:

1. Copy any changed hex/type/spacing values from the sheet.
2. Update the token table in
   `.claude/skills/wordcamp-design-system/SKILL.md` so the skill reflects the
   final values.
3. Ensure the code tokens (CSS `:root` variables + `tailwind.config.js`) use the
   same values — the skill is the single source of truth the build reads from.
4. If you saved the artifact, drop it in `docs/design/` (e.g.
   `design-system.dc.html` or a screenshot) and link it from the skill so future
   sessions can see the intended look. Commit as
   `docs(design): add visual design-system reference`.

> Keep the SKILL.md and the visual sheet in agreement. If they ever diverge, the
> SKILL.md tokens win for code, and you should re-export the sheet to match.
