# P2-01 Design Tokens

## Scope

P2-01 establishes the visual token layer only. It does not add components,
application shells, navigation, routes, or product behavior.

The canonical custom properties live in `src/styles.css` and use the
`--club-*` prefix. Tailwind v4 theme variables map to those canonical values,
so CSS and utility-based consumers share one source of truth.

## Palette

| Purpose | CSS custom property | Tailwind utility suffix | Value |
|---|---|---|---|
| Pitch | `--club-color-pitch` | `pitch` | `#132018` |
| Gold | `--club-color-gold` | `gold` | `#C9A24B` |
| Chalk | `--club-color-chalk` | `chalk` | `#F4EFE1` |
| Danger | `--club-color-red` | `danger` | `#B4432F` |
| Warning | `--club-color-amber` | `warning` | `#C08A2E` |
| Success | `--club-color-success` | `success` | `#3F8F5A` |
| Deep pitch | `--club-color-pitch-deep` | `pitch-deep` | `#0B120D` |
| Surface | `--club-color-surface` | `surface` | `#1B2A20` |
| Raised surface | `--club-color-surface-raised` | `surface-raised` | `#24362A` |
| Border | `--club-color-border` | `club-border` | `#314437` |
| Dim chalk | `--club-color-chalk-dim` | `chalk-dim` | `#C9C5B9` |
| Muted content | `--club-color-muted` | `muted` | `#8F9C91` |

Tailwind consumers can compose normal utilities such as `bg-pitch`,
`text-gold`, `border-club-border`, `bg-danger`, and `text-success`.

## Typography

- `font-body` resolves to Inter with a native system sans-serif fallback
  stack. Body text inherits this stack.
- `font-display` resolves to Oswald with condensed and system sans-serif
  fallbacks. Native headings and buttons receive this stack; future numbers
  and tab labels should use `font-display` explicitly.

The root document loads Inter (400–700) and Oswald (400–700) from Google Fonts
with `display=swap`, plus preconnect hints for the stylesheet and font origin.
The CSS fallback stacks keep content readable when the remote font service is
unavailable. No font files or credentials are bundled.

## Layout and spacing

| Purpose | CSS custom property | Tailwind utility example | Value |
|---|---|---|---|
| Application maximum width | `--club-layout-max-width` | `max-w-app` | `42rem` |
| Mobile inline gutter | `--club-layout-gutter` | `px-app-gutter` | `1rem` |
| Section rhythm | `--club-space-section` | `gap-section` | `1.5rem` |
| Card inset | `--club-space-card` | `p-card` | `1rem` |
| Minimum control target | `--club-size-touch` | `min-h-touch` | `2.75rem` |
| Bottom navigation reserve | `--club-size-bottom-nav` | `pb-bottom-nav` | `4.5rem` |

The existing starter `main` behavior remains centered at a maximum of 42rem
with 1rem gutters. Future application shells should use `max-w-app`, full
width, auto horizontal margins, and `px-app-gutter`; this retains a constrained
mobile application column on larger screens without becoming a desktop admin
layout.

## Verification

P2-01 is verified by:

1. Formatting and lint checks.
2. TypeScript type-checking.
3. A production build.
4. A temporary Tailwind source probe containing each documented utility; the
   probe is removed after the build, and the emitted CSS is inspected for the
   expected custom-property-backed declarations.
