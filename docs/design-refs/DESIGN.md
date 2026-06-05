---
name: Disciplined Authority Dark
colors:
  surface: '#121412'
  surface-dim: '#121412'
  surface-bright: '#383a37'
  surface-container-lowest: '#0d0f0d'
  surface-container-low: '#1a1c1a'
  surface-container: '#1e201e'
  surface-container-high: '#292a28'
  surface-container-highest: '#333533'
  on-surface: '#e2e3df'
  on-surface-variant: '#c8c7b9'
  inverse-surface: '#e2e3df'
  inverse-on-surface: '#2f312e'
  outline: '#919185'
  outline-variant: '#47483d'
  surface-tint: '#c4cb9a'
  primary: '#c4cb9a'
  on-primary: '#2d3310'
  primary-container: '#8e9568'
  on-primary-container: '#272c09'
  inverse-primary: '#5b6239'
  secondary: '#bfc9be'
  on-secondary: '#2a332b'
  secondary-container: '#424b43'
  on-secondary-container: '#b1bbb0'
  tertiary: '#c4c9b5'
  on-tertiary: '#2e3224'
  tertiary-container: '#8e9381'
  on-tertiary-container: '#272b1e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e0e7b4'
  primary-fixed-dim: '#c4cb9a'
  on-primary-fixed: '#191e00'
  on-primary-fixed-variant: '#444a24'
  secondary-fixed: '#dbe5d9'
  secondary-fixed-dim: '#bfc9be'
  on-secondary-fixed: '#151e16'
  on-secondary-fixed-variant: '#404941'
  tertiary-fixed: '#e1e5d0'
  tertiary-fixed-dim: '#c4c9b5'
  on-tertiary-fixed: '#191d11'
  on-tertiary-fixed-variant: '#44493a'
  background: '#121412'
  on-background: '#e2e3df'
  surface-variant: '#333533'
typography:
  headline-xl:
    fontFamily: IBM Plex Serif
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: IBM Plex Serif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: IBM Plex Serif
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: IBM Plex Serif
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
spacing:
  unit: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system embodies a sense of command, longevity, and quiet power. It is designed for high-stakes environments—finance, intelligence, or premium institutional tools—where clarity and decisiveness are paramount. 

The aesthetic is a fusion of **Minimalism** and **Corporate Modernism**, utilizing a "Night Ops" palette. The atmosphere is nocturnal and focused, reducing ocular strain while maintaining an air of exclusivity. Every element is intentional; there is no decorative excess. The UI evokes the feeling of a high-end physical dashboard—precise, tactile, and unfailingly reliable.

## Colors

The palette transitions the original olive-drab authority into a low-light environment. 

- **Primary:** A desaturated, luminous Olive (#8C9366) used for calls to action and critical status indicators.
- **Background:** A deep "Deep Forest" charcoal (#0D0F0D) provides the foundation, ensuring deep blacks without losing the organic green undertone.
- **Surfaces:** Containers use a slightly lifted Forest Green (#1A1D1A) to create clear spatial hierarchy.
- **Accents:** Secondary tones are used for subtle borders and inactive states, while Tertiary tones provide high-contrast highlights for data visualization and "Warning" states are handled through muted ochres rather than bright reds to maintain the disciplined aesthetic.

## Typography

The typography strategy leverages the **IBM Plex** family to strike a balance between institutional tradition and technical precision.

**IBM Plex Serif** is reserved for headlines to convey heritage and "The Written Word" of authority. Its sharp terminals feel precise and deliberate.
**IBM Plex Sans** handles all functional data and body text. Its engineered, slightly industrial feel ensures legibility in dark environments where light "bloom" from text can be an issue.

- **Contrast:** High-level headers use primary text colors, while captions and metadata use secondary text colors to establish a clear information scan-path.
- **Hierarchy:** Use uppercase labels for section headers to mimic military or governmental filing systems.

## Layout & Spacing

The layout utilizes a **Fixed Grid** philosophy on desktop to maintain a sense of structured control, transitioning to a fluid model for mobile.

- **Desktop:** A 12-column grid with wide 64px margins creates a "letterboxed" cinematic feel, focusing the user's attention on the central data.
- **Rhythm:** All spacing is derived from a 4px baseline. Components typically utilize 16px or 24px of internal padding to ensure "breathing room" which is vital for maintaining a premium feel in dark mode.
- **Alignment:** Elements should be strictly aligned to the grid; avoid "soft" or staggered placements. Symmetry is preferred to evoke stability.

## Elevation & Depth

In this dark system, depth is conveyed through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Tier 1 (Base):** The #0D0F0D background.
- **Tier 2 (Containers):** The #1A1D1A surface. These containers are defined by a 1px solid border (#2D362E) rather than a shadow.
- **Tier 3 (Popovers/Modals):** A slightly lighter surface (#242824) with a very subtle, 15% opacity black shadow to create a minute lift from the UI.
- **Interaction:** Hover states are indicated by a subtle increase in border luminosity or a faint inner glow, mimicking the backlighting of a physical instrument panel.

## Shapes

The design system utilizes **Sharp (0)** corners for all primary UI components. 

The absence of roundedness reinforces the "Disciplined Authority" narrative—it is uncompromising, architectural, and serious. Rectilinear shapes allow for tighter grid integration and a more technical, professional appearance. 

*Exception:* Small status dots or radio buttons remain circular to provide a necessary visual distinction from structural elements.

## Components

- **Buttons:**
    - **Primary:** Solid Primary Olive (#8C9366) with Black text (#000000) for maximum legibility. No border.
    - **Secondary:** Transparent background with a 1px Primary Olive border. Text is Primary Olive.
- **Input Fields:** Dark background (#0D0F0D) with a #2D362E border. On focus, the border brightens to Primary Olive and a faint 2px outer glow is applied.
- **Cards:** No shadow. 1px border (#2D362E). Headers within cards should have a subtle background tint to separate them from the card body.
- **Status Chips:** Small, rectangular, with monochromatic backgrounds. Use the Tertiary color for active/neutral status and a muted red-tinted charcoal for errors.
- **Data Tables:** Highly structured with 1px horizontal dividers only. Header rows use `label-md` typography with a subtle background fill.
- **Lists:** Clean, high-contrast text with 16px vertical padding between items. Use chevron icons for navigation, keeping them thin (1px stroke).