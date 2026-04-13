# Liquid Glass

Real optical refraction for the web. Not just `backdrop-filter: blur()` — actual displacement-based light bending with chromatic aberration. Zero dependencies. Copy one file.

**[Live Demo](https://liquid-glass.vercel.app)**

## What it does

Most "glassmorphism" on the web is frosted glass — content blurs behind an element. Liquid Glass goes further: content **warps** through the edges like you're looking through a real lens. There's subtle rainbow fringing (chromatic aberration) at the boundaries. The center stays crystal clear. It looks like Apple's iOS 18 liquid glass, but on the web.

The effect uses:
- **Canvas 2D** to generate a displacement map (red/blue gradients for X/Y displacement)
- **SVG `feDisplacementMap`** to warp backdrop content through the map
- **Three passes** (one per RGB channel) with slightly different displacement scales, creating chromatic aberration
- **`backdrop-filter: url(#svg-filter)`** to apply it all to the content behind any element

## Browser support

| Browser | Effect |
|---------|--------|
| Chrome / Edge / Arc / Brave | Full displacement + chromatic aberration |
| Safari / Firefox | Automatic fallback to `backdrop-filter: blur(12px)` |

The full effect requires `backdrop-filter: url()` with an SVG filter reference, which is Chromium-only. Detection is automatic — non-Chromium browsers get a clean blur fallback, no errors.

## Quick start

### Copy-paste (recommended)

1. Copy `core/liquid-glass.js` into your project
2. Import and call:

```js
import { createLiquidGlass } from './liquid-glass.js'

const glass = createLiquidGlass(document.querySelector('.my-navbar'))
// That's it. Auto-detects size, handles fallback, cleans up on destroy().
```

### With options

```js
const glass = createLiquidGlass(element, {
  borderRadius: 24,        // match your CSS border-radius
  scale: -120,             // displacement strength (default: -180)
  aberration: [0, 8, 16],  // chromatic aberration per RGB channel
  frost: 0.1,              // dark overlay opacity
})
```

### React

Copy `react/use-liquid-glass.ts` alongside the core file:

```tsx
import { useLiquidGlass } from './use-liquid-glass'

function MyNav() {
  const navRef = useRef<HTMLDivElement>(null)
  const { isActive } = useLiquidGlass(navRef, { borderRadius: 24 })

  return <nav ref={navRef} className="my-nav">...</nav>
}
```

## API

### `createLiquidGlass(element, options?)`

Returns a `LiquidGlassInstance`.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | `number` | auto | Element width in px. Auto-detected via ResizeObserver. |
| `height` | `number` | auto | Element height in px. Auto-detected via ResizeObserver. |
| `borderRadius` | `number` | `50` | Border radius in px. Match your CSS. |
| `scale` | `number` | `-180` | Displacement strength. More negative = more warp. |
| `aberration` | `[r, g, b]` | `[0, 10, 20]` | Per-channel scale offsets for chromatic aberration. |
| `blur` | `number` | `11` | Edge blur for center neutralization zone. |
| `border` | `number` | `0.07` | Neutralization inset as fraction of min(width, height). |
| `lightness` | `number` | `50` | Center lightness (0-100). |
| `alpha` | `number` | `0.93` | Center opacity (0-1). |
| `frost` | `number` | `0` | Dark overlay opacity (0-1). 0 = clear glass. |
| `saturation` | `number` | `1` | Backdrop saturation multiplier. |
| `displaceBlur` | `number` | `0` | Post-displacement blur in px. |
| `filterId` | `string` | auto | Unique SVG filter ID. Auto-generated if omitted. |
| `fallbackFilter` | `string` | `"blur(12px)"` | Backdrop-filter for non-Chromium browsers. |

#### Instance

| Property/Method | Description |
|-----------------|-------------|
| `isActive` | `boolean` — `true` if full displacement is active (Chromium) |
| `update(opts)` | Update options without re-creating. Regenerates map if size changed. |
| `destroy()` | Remove all DOM artifacts (SVG, styles, observers). |
| `filterElement` | The generated `<svg>` element containing the filter definition. |

### `isChromium`

Exported boolean. `true` if the current browser supports the full effect.

## How it works

### The displacement map

The core of the effect is a Canvas-generated displacement map:

```
┌──────────────────────────────────────────┐
│         neutral gray (128,128,128)       │  ← no displacement
│    ┌──────────────────────────────┐      │
│    │  red gradient ──► (X-axis)   │      │
│    │  blue gradient ▼  (Y-axis)   │      │
│    │    ┌──────────────────┐      │      │
│    │    │ blurred gray     │      │      │
│    │    │ (neutralized     │      │      │
│    │    │  center)         │      │      │
│    │    └──────────────────┘      │      │
│    └──────────────────────────────┘      │
└──────────────────────────────────────────┘
```

- **Neutral gray** = zero displacement (pixels stay put)
- **Red gradient** left-to-right = X-axis displacement
- **Blue gradient** top-to-bottom = Y-axis displacement (blended with `globalCompositeOperation: 'difference'`)
- **Blurred gray center** = smooth falloff from no-displacement center to warped edges

### Why Canvas, not SVG-in-SVG

The original technique (by [Jhey Tompkins](https://codepen.io/jh3y)) generates the map as an inline SVG loaded via `feImage`. This works in theory — the SVG can use `mix-blend-mode: difference` and `filter: blur()` for the center neutralization.

**Except `feImage` renders SVG data URIs as images**, which restricts CSS property evaluation. `mix-blend-mode` gets ignored. `filter: blur()` gets ignored. The center rect doesn't neutralize, and the whole element becomes a warped mess.

**Canvas 2D doesn't have this problem.** `globalCompositeOperation = 'difference'` and `ctx.filter = 'blur()'` are native API calls, not CSS properties. They always work. The Canvas output is a correct bitmap every time.

### The filter region trap

SVG filters have a **filter region** — the area they process. Default is 10% beyond the element. For a 48px element, that's 4.8px of extra backdrop captured.

But with `scale: -180`, edge pixels can displace up to **90px**. When `feDisplacementMap` tries to sample 90px away, that position is outside the captured region. Transparent. The warp dies.

**Fix:** Extend the filter region to cover the full displacement range. The library calculates this automatically from your `scale` value.

### The alignment trap

When you extend the filter region, `feImage` fills the **entire region**, not just the element. A 240x48 displacement map gets stretched to fill a 720x240 region, completely misaligning the pill in the map with the element on screen.

**Fix:** Pre-size the Canvas to match the full filter region. The pill shape is drawn centered in a larger canvas padded with neutral gray. `feImage` fills naturally, the map aligns with the element, and the gray padding ensures zero displacement outside the pill.

### Chromatic aberration

Three separate `feDisplacementMap` passes run with slightly different `scale` values:
- Red: `scale + 0` (most displaced)
- Green: `scale + 10` (medium)
- Blue: `scale + 20` (least displaced)

Each pass is isolated with `feColorMatrix` (extract one channel, zero the others), then blended back with `feBlend mode="screen"`. The result: each color channel refracts at a slightly different angle, creating that prismatic rainbow fringing at edges.

## Gotchas

- **`backdrop-filter: url()` is Chromium-only** — this isn't a webkit thing, Safari doesn't support it either
- **SVG filter must be in the same document** — shadow DOM won't work
- **Large elements (>800px wide)** may cause GPU jank — reduce `scale` for large surfaces
- **The SVG element must not be `display: none`** — the library uses `width: 0; height: 0` instead
- **Filter ID must be unique per instance** — auto-generated by default, but if you set `filterId` manually, ensure uniqueness
- **`opacity < 1` on a parent** creates a stacking context that can interfere — test your specific layout

## Credits

- Displacement map technique by [Jhey Tompkins](https://codepen.io/jh3y)
- Extracted from [rizzy.today](https://rizzy.today) by Riz Roze

## License

MIT
