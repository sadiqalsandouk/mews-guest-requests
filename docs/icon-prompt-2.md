# Codex follow-up: redraw the hotel icons (tier 2)

Thanks for the icon set. The UI icons (tier 1) and the guest stage illustrations (tier 3) are good: **don't change them**. This pass is only about the 12 hotel icons in `src/components/icons/`, which don't read well yet. Preview them at `/dev/icons`.

## What's wrong now

1. **Too small and thin to read where they're used.** In the New request form (`src/components/new-request-dialog.tsx`, preset tiles) they render at `size-4` (16px) with a 1.5px stroke, so towels, pillows, late checkout and heating/AC look like empty rectangles.
2. **Two send the wrong message.**
   - `dept-maintenance` looks like a knife and fork, which reads as "restaurant".
   - `dept-housekeeping` looks like a bin.
3. **The pink accent is invisible.** The fill uses `var(--mews-orchid-tint)` (#fcf0fa), which is nearly white, so these look the same as the UI icons.
4. **The Mews lobe motif barely shows.**

## What to do

### Size and weight
- Draw them on a **24×24 grid** with a **1.75px stroke** (the UI icons stay at 1.5px on 20×20).
- Bigger, simpler silhouettes: 2–3 shapes each, no fine detail. They must be readable at 20px, and still recognisable at 16px.
- In `new-request-dialog.tsx`, render the preset icons at `size-6` (24px) instead of `size-4`. In the guest quick buttons (`src/components/guest-app.tsx`), use `size-5`.

### A visible accent
- Every hotel icon gets **one filled accent shape** in `var(--icon-accent, var(--mews-pink-light))` (#ffc5ee), drawn *behind* the stroke. Pick a meaningful part to fill: the towel, the bell's dome, the pillow, the hanger tag.
- It must be visible on white, on `--mews-grey` and on `--mews-orchid-tint`. Check all three on `/dev/icons`.
- Strokes stay `currentColor`.

### The lobe motif
- Where it fits naturally, build the accent from the **soft rounded lobe/pill** shape in the Mews symbol (`src/app/icon.svg`): a pill-shaped towel, a lobe-shaped pillow, a rounded hanger tag. Subtle. Don't copy the logo.

### Clear hotel images (redraw all 12)

| Icon | Draw this | Avoid |
|---|---|---|
| `dept-maintenance` | A spanner (wrench), angled, with a pill-shaped accent head | Knife and fork, screwdriver and spoon |
| `dept-housekeeping` | A folded towel or a bed corner with a turned-down sheet | Anything bin-like |
| `dept-front-desk` | Reception bell (keep the idea; fill the dome) | — |
| `towels` | Two folded towels stacked, or a towel hanging on a rail | A plain rectangle |
| `pillows` | One plump pillow with soft corners (lobe shape) | A flat rectangle |
| `room-cleaning` | Spray bottle with a few mist dots | Sparkles |
| `shower-water` | Shower head with 3–4 water drops below | Unclear abstract shapes |
| `heating-ac` | Wall AC unit with 2–3 airflow waves, or a thermometer with a wave | A striped box |
| `tv-wifi` | TV screen with a small Wi-Fi arc above it | — |
| `something-broken` | Spanner crossed with a small crack, or a plug with a spark | A lightning bolt alone |
| `late-checkout` | Door hanger with a small clock on the tag | A phone or battery shape |
| `taxi` | Front view of a car with a roof sign | — |

## Rules

- Same React component names and exports, so nothing else breaks.
- Don't touch tier 1, tier 3, layout, copy or behaviour. The only call-site changes are the `size-*` classes above.
- Keep `/dev/icons` working. Add a fourth row there showing the hotel icons at 24px inside the actual preset tile style (white tile, border, label underneath), so they're judged in context.
- Run `npx tsc --noEmit` and `npm run lint`.

## Done when

- Each hotel icon is recognisable at 20px **without its label**. Test by covering the labels on `/dev/icons`.
- Maintenance reads as repair and housekeeping reads as cleaning or bedding.
- The pink accent is clearly visible on all three backgrounds.
- The New request form tiles look balanced: icon, then label, with nothing cramped.
