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
> system as a gallery (like a mini Figma style page). Use these exact brand
> tokens as the foundation (they match the owner's personal brand — keep them):
>
> **Color**
> - Navy `#0f2438` — primary text, headings, structure
> - Blue `#1b6ec2` — the single accent: links, active states, dates, focus rings
> - Blue hover `#155a9e`
> - Slate `#64748b` — secondary/muted text, metadata
> - Page background `#f8fafc`
> - Surface/card `#ffffff`
> - Border/hairline `#e2e8f0`
> - Danger `#b91c1c` — error states
> - (optional) Success `#15803d`
>
> **Type:** Inter (system-ui fallback). h1 2rem/700; section labels 0.85rem/700
> uppercase, letter-spacing; card titles 1rem/600; body 1rem/400; meta 0.85rem.
> Left-aligned, line-height ~1.5 body / 1.2 headings.
>
> **Shape/space:** 4px spacing scale; card radius 10px; pill/tab radius 999px;
> no shadow at rest, soft shadow on card hover only.
>
> The sheet must include, each shown as a real rendered example with a label:
> 1. **Color palette** — swatches with token name + hex + intended use.
> 2. **Typographic scale** — each level rendered with its spec.
> 3. **Spacing & radius** — a small scale reference.
> 4. **Buttons** — primary, secondary/ghost, with hover and focus-visible states.
> 5. **Tabs** — a pill segmented "Upcoming / Past" control, active vs inactive.
> 6. **WordCampCard** — card with a linked title (navy→blue on hover), a blue
>    bold date line (e.g. "Sat, 14 Mar 2026"), and a slate location line; show a
>    normal card and one with a missing date ("Date TBD") and no location.
> 7. **Calendar section** — an uppercase blue month label ("March 2026") with a
>    hairline rule beneath, then a responsive grid of 2–3 cards.
> 8. **States** — loading (skeleton cards, NOT a spinner), empty (a calm slate
>    sentence), and error (a danger-colored callout with a plain-language message).
>
> Constraints: use ONLY the tokens above — one accent color, no gradients, no
> decorative illustration, no second accent. Everything must meet WCAG AA
> contrast (navy and slate on white; white on the blue active pill). Show visible
> focus rings in blue on interactive elements. Keep it tasteful and minimal.
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
