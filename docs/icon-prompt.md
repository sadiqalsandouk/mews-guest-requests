# Codex prompt: custom icon set for Mews Guest Requests

You are working in a Next.js 16 + React 19 + Tailwind CSS v4 + shadcn/ui app at the repo root (`src/`). It is a concept product for Mews (hotel software): a staff app (`/staff`, `/staff/settings`) and a guest page (`/guest?room=507`). Every icon today comes from `lucide-react`, which makes the app look generic and AI-generated. Replace them with an original, cohesive icon set that feels like it belongs to Mews's product and makes the app feel premium and specific to hospitality.

## Design language to match (read `src/app/globals.css` first)

- Brand: Mews 2026 identity. Black and white base, pink as the signature. The Mews symbol is an "M" built from three soft rounded vertical lobes (see `src/app/icon.svg`). Borrow that **soft lobe / pill** shape as the family's signature detail: rounded caps on short strokes, pill-shaped elements, gentle curves. Do NOT copy the logo itself.
- Product UI (staff app): calm and operational, like the Mews PMS. Small corner radius (6px), thin grey borders, status dots, pink used sparingly as an accent.
- Colour tokens (use CSS variables, never hard-coded hex inside icons):
  - `currentColor` for the main stroke/fill
  - `var(--mews-orchid)` (#d46fc4) as the optional accent
  - `var(--mews-orchid-tint)` (#fcf0fa) for soft duotone fills
  - status: `--mews-dot-green`, `--mews-dot-amber`, `--mews-dot-red`, `--mews-slate`
- Typeface feel: Söhne-like (geometric grotesk). Icons should sit next to 14px Inter text without looking heavier than the text.

## Three tiers

1. **UI icons** (staff app chrome, menus, buttons). 20×20 grid, 1.5px stroke, `fill="none"`, stroke `currentColor`, `stroke-linejoin="round"`. Mix round and flat caps on purpose (flat on long lines, round on short ones) so the set doesn't read as Lucide. 2px safe padding. Must stay crisp at 16px.
2. **Hospitality icons** (departments and request presets). 24×24 grid, same stroke, plus ONE duotone accent shape filled with `var(--icon-accent, var(--mews-orchid-tint))`. Friendly, specific to hotels (towel folded on a rail, not a generic bathtub).
3. **Guest spot illustrations** (the guest tracker's stage art, about 120×120). Flat, geometric, built from the same lobe/pill motif, in brand colours. Each animated part goes in its own `<g>` with a `data-part` attribute so the existing CSS animations keep working:
   - `received`: bell, `data-part="clapper"` (wiggles; class `gr-wiggle`)
   - `assigned`: staff badge or avatar frame (floats; `gr-float`)
   - `on_the_way`: path from department to door, `data-part="traveller"`
   - `fixed`: check in a lobe-shaped badge (pops; `gr-pop`)
   - `confirmed`: check plus a small celebratory burst (separate from the existing confetti)
   - `rate`: a star made from rounded lobes, used for 1–5 ratings (with filled and empty states)

## Avoid

- Emoji, gradients, 3D, glossy effects, drop shadows inside icons.
- AI clichés: no sparkles or magic wands for "AI" or "translated", no robot faces.
- Generic stock metaphors when a hotel-specific one exists.
- Copying Lucide, Heroicons, Phosphor or Material shapes. Draw them fresh.
- Using the same icon for two meanings.

## Inventory: replace every one (current Lucide name → new semantic name)

**Navigation and chrome** (tier 1)
- Menu → `menu`, X → `close`, ArrowLeft → `back`, ChevronLeft / ChevronRight / ChevronDown → `chevron-left` / `chevron-right` / `chevron-down`
- Search → `search`, Settings → `settings`, LogOut → `sign-out`, ListFilter → `filter`
- List → `view-list`, CalendarRange → `view-timeline` (week grid, nod to the PMS calendar), LayoutList → `requests-board`
- Plus / Minus → `add` / `remove`, Play / Pause → `play` / `pause`
- Check → `check`, X in tags → `clear`
- RotateCcw has two meanings today, so split it: `reset-demo` (counter-clockwise arrow) and `repeat-issue` (two stacked lobes or loop, meaning "this room again")
- History → `last-week`, Timer → `time-limit` (escalation and due-next), UserCheck → `assign`
- Smartphone → `guest-view`, Mic → `dictate`

**Status** (tier 1, colour comes from the caller)
- CircleDot → `status-open`, CheckCircle2 → `status-closed`, AlertTriangle → `status-overdue` (not a hazard triangle; something calmer, like a clock with a notch), Bell → `status-received`
- Phone → `logged-by-desk` (desk phone handset)
- Globe → `language` (speech bubble with "A" and "ع" or similar)
- Sparkles (meaning "translated") → `translated` (two overlapping speech bubbles)
- Star → `rating` (tier 3 star, but also a 16px version)

**Departments** (tier 2)
- Wrench → `dept-maintenance`, BedDouble (department) → `dept-housekeeping`, ConciergeBell → `dept-front-desk`

**Request presets** (tier 2, used in `new-request-dialog.tsx` and the guest quick buttons)
- Bath → `towels`, BedDouble (preset) → `pillows`, Sparkles (cleaning) → `room-cleaning` (a spray bottle or folded corner, NOT sparkles)
- ShowerHead → `shower-water`, Thermometer → `heating-ac`, Wifi → `tv-wifi`, Wrench (preset) → `something-broken`
- Clock → `late-checkout` (door hanger), Car → `taxi`
- DoorOpen → `room-door`

**Inside `src/components/ui/`** (shadcn internals): XIcon, CheckIcon, SearchIcon, ChevronRightIcon. Swap these to the new set too, without changing those components' behaviour.

## Implementation

1. Create `src/components/icons/` with one React component per icon (e.g. `MenuIcon`), all sharing one base:
   ```tsx
   type IconProps = React.SVGProps<SVGSVGElement> & { title?: string };
   // aria-hidden unless `title` is given; className controls size (default size-4/size-5 like now)
   ```
   Export everything from `src/components/icons/index.ts`. No new dependencies.
2. Keep the call sites' existing `className` sizing (`size-4`, `size-5`, etc.) and colour classes working. Icons must use `currentColor`.
3. Replace every `lucide-react` import in `src/` with the new icons, then remove `lucide-react` from `package.json`. Also set `"iconLibrary"` in `components.json` to a custom value or leave a note, so future `shadcn add` calls don't bring Lucide back silently.
4. Swap the guest tracker's stage art in `src/components/guest-app.tsx` (`StageArt`) to the tier 3 illustrations, keeping the existing animation classes (`gr-wiggle`, `gr-float`, `gr-pop`, `gr-travel`) on the `data-part` groups. Respect `prefers-reduced-motion` (already handled in `globals.css`).
5. Add a preview page at `src/app/dev/icons/page.tsx` showing every icon at 16, 20 and 24px, in a grid with its name, on three backgrounds: white, `--mews-grey`, and `--mews-orchid-tint`. Show the tier 3 illustrations at full size. Not linked from the app.

## Rules

- Don't change layout, copy, behaviour or business logic. This is an icon swap plus the preview page.
- Keep the visual weight close to today's, so nothing shifts or looks heavier.
- Every icon must be readable at 16px. Check the preview page at 16px before finishing.
- Run `npx tsc --noEmit` and `npm run lint` and fix anything they report.
- If you change `globals.css` theme tokens, the dev server serves stale CSS until restarted with `rm -rf .next && npm run dev`.

## Done when

- `grep -r "lucide-react" src` returns nothing.
- `/dev/icons` shows the full set and it reads as one family, with the lobe motif visible but subtle.
- `/staff`, `/staff/settings` and `/guest?room=507` look the same as before apart from the icons, with no layout shifts.
