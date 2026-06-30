# Mass Academy — Design Philosophy

## The metaphor: ink on paper

Every visual decision traces back to a physical artifact — printed matter, archival documents, typeset pages. Not a SaaS dashboard. Not a startup landing page. A platform that looks like it was made by people who've been doing something for decades.

**Colors are literal:**
- `paper` (`#ffffff`) — the substrate
- `ink` (`#000000`) — what's written on it
- `ink-muted` (`#525252`) — secondary annotation
- `ink-faint` (`#a3a3a3`) — marginalia, metadata
- `rule` (`#e5e5e5`) — the printed line between sections
- `accent` (orange-500) — the one warm mark; a stamp, a highlight, a human touch

No gradients. No glows. No shadows except where depth is structurally necessary.

## Typography

Two fonts, one job each:
- **Geist** (sans) — body, labels, UI chrome. Clean, neutral, disappears.
- **Figtree** (serif alias, used as `font-serif`) — headings and titles. Grounded, not decorative.

`.label` class is the typographic anchor: `11px / 500 / 0.14em tracking / uppercase`. Used for category tags, section headers, metadata. Never make a label bigger — it loses its character.

## Geometry

**No decorative radius.** Rounded corners signal softness, approachability, consumer tech. This platform is for people who work with their hands and their minds. Edges are sharp. `rounded-sm` is the maximum — reserved for interactive elements that need a tap target affordance, not decoration.

Borders are `border-rule` — the printed line, not a box. Components sit next to each other separated by rules, not enclosed in cards.

## Texture

The one exception to flatness: the stipple pattern.

```css
/* bg-stipple — physical texture for quantitative displays */
background-image: [4×4 SVG, 1px diagonal dots at (0,0) and (2,2)];
background-size: 3.5px 4px; /* slightly compressed x-axis */
```

The `representative` ProgressBar variant uses stipple as the unfilled base, with a solid `bg-ink` fill overlaid. No border on the bar — it sits flush. The result reads like a printed gauge, not a web component.

Use `.bg-stipple` + the `representative` variant anywhere you need to communicate quantity or progress in a physical, non-digital way. Do not substitute with gradient fills, animated bars, or rounded progress indicators.

## Motion

Minimal. `transition-colors` and `transition-[width]` only. No entrance animations, no parallax, no scroll reveals. The platform earns attention through content, not motion.

## Interaction states

- **Hover:** border goes from `rule` to `ink`. The line gets darker — nothing else changes.
- **Focus:** `border-ink-faint`. Subtle.
- **Disabled:** `opacity-40`. No style change, just dimming.
- **Active/selected:** `bg-ink text-paper` — inverts. The same ink/paper metaphor reversed.

## What this is NOT

- No purple gradients
- No glassmorphism
- No hero illustrations or decorative SVGs
- No emoji in UI copy
- No Inter, no Roboto, no system-ui as a design choice
- No "card" pattern with shadow + white background on white background

## Voice → Visual mapping

From the product brief: *"Quiet confidence. First principles. No buzzwords."*

In visual terms:
- Quiet confidence = high contrast, generous whitespace, restraint
- First principles = no decoration that doesn't carry meaning
- No buzzwords = no visual clichés (gradients, rounded cards, glowing CTAs)

The platform should feel like it was designed by someone who reads technical manuals for pleasure.
