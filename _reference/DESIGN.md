---
name: Cinematic Motion System
colors:
  surface: '#0e1418'
  surface-dim: '#0e1418'
  surface-bright: '#343a3f'
  surface-container-lowest: '#090f13'
  surface-container-low: '#171c21'
  surface-container: '#1b2025'
  surface-container-high: '#252b2f'
  surface-container-highest: '#30353a'
  on-surface: '#dee3e9'
  on-surface-variant: '#bdc8d2'
  inverse-surface: '#dee3e9'
  inverse-on-surface: '#2b3136'
  outline: '#87929c'
  outline-variant: '#3e4851'
  surface-tint: '#89ceff'
  primary: '#89ceff'
  on-primary: '#00344d'
  primary-container: '#00b4ff'
  on-primary-container: '#004361'
  inverse-primary: '#006591'
  secondary: '#6cffbf'
  on-secondary: '#003824'
  secondary-container: '#00e5a0'
  on-secondary-container: '#006141'
  tertiary: '#ffb86a'
  on-tertiary: '#492900'
  tertiary-container: '#f09408'
  on-tertiary-container: '#5b3500'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c9e6ff'
  primary-fixed-dim: '#89ceff'
  on-primary-fixed: '#001e2f'
  on-primary-fixed-variant: '#004c6e'
  secondary-fixed: '#47ffb8'
  secondary-fixed-dim: '#00e29e'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdcbc'
  tertiary-fixed-dim: '#ffb86a'
  on-tertiary-fixed: '#2c1700'
  on-tertiary-fixed-variant: '#683d00'
  background: '#0e1418'
  on-background: '#dee3e9'
  surface-variant: '#30353a'
typography:
  display-lg:
    fontFamily: Bebas Neue
    fontSize: 72px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: 0.02em
  headline-xl:
    fontFamily: Bebas Neue
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: 0.04em
  headline-md:
    fontFamily: Bebas Neue
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: 0.04em
  headline-sm:
    fontFamily: Bebas Neue
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: 0.04em
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  ui-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The design system is engineered for the modern digital auteur. It bridges the gap between the static nature of traditional photography and the fluid narrative of cinematic video. The brand personality is professional, avant-garde, and high-performance, evoking the atmosphere of a darkened editing suite or a high-end film production house.

The aesthetic follows a **Tech-Forward Glassmorphism** style. It utilizes deep layering, background blurs, and luminous accents to create a sense of depth and focus. High contrast is a functional requirement here, ensuring that creative tools and content "pop" against a near-black canvas. The visual narrative emphasizes movement, speed, and precision.

## Colors

The palette is rooted in the "Dark Mode First" philosophy. The **#0a0a0a Background** provides a void-like canvas that minimizes UI distraction. 

- **Primary Cyan (#00b4ff):** Used for active states, primary actions, and "Live" indicators. It represents the "Digital Soul" of the platform.
- **Secondary Teal (#00e5a0):** Used for success states, rendering progress, and creative enhancements.
- **Accent Amber (#f5a623):** Used sparingly for critical alerts, record buttons, and highlighting "Director's Choice" features.
- **Neutral Gradients:** Components should leverage subtle linear gradients from Primary to Secondary (at 15% opacity) to signify movement and transitions.

## Typography

Typography is a mix of cinematic impact and technical precision.

- **Headings:** **Bebas Neue** provides a tall, condensed, film-poster aesthetic. It should be used for all major headers and section titles to create a strong vertical rhythm.
- **Body:** **Geist** offers a clean, ultra-modern sans-serif look for descriptions and readable content.
- **Technical UI:** **JetBrains Mono** is utilized for metadata, timestamps, frame rates, and functional labels, reinforcing the "Studio Tool" feel.
- **Scaling:** For mobile devices, `display-lg` should scale down to 48px to maintain legibility and impact without breaking layout boundaries.

## Layout & Spacing

The design system utilizes a **12-column Fixed Grid** for desktop and a **4-column Fluid Grid** for mobile. 

The layout philosophy centers on "Negative Space as Focus." By keeping margins wide (64px on desktop), content is pushed to the center, emulating a widescreen viewing experience. 

- **Vertical Rhythm:** Built on a 4px base unit. All component heights and vertical spacing should be multiples of 4.
- **Containment:** Functional UI elements are grouped in "Floating Dock" structures rather than edge-to-edge bars, creating a lightweight, modern feel.

## Elevation & Depth

Hierarchy is established through **Backdrop Blurs** and **Luminous Outlines** rather than traditional heavy drop shadows.

1.  **Level 0 (Base):** #0a0a0a background.
2.  **Level 1 (Card/Section):** #141414 surface with a 1px solid border at 10% white opacity.
3.  **Level 2 (Modals/Overlays):** Glassmorphism effect—Background blur (20px) with a semi-transparent fill (`rgba(20, 20, 20, 0.7)`).
4.  **Shadows:** Use "Glow Shadows" for active elements. Instead of black shadows, use a diffused Primary Cyan shadow at low opacity (e.g., `0 10px 30px rgba(0, 180, 255, 0.15)`).

## Shapes

The shape language is **Sleek and Architectural**. 

- **Primary Radius:** 0.25rem (4px) for most UI elements (Inputs, Buttons, Mini-cards). This keeps the look sharp and professional.
- **Large Radius:** 0.75rem (12px) for main content containers and video player wrappers, providing a subtle "frame" effect.
- **Pills:** Used exclusively for status indicators (e.g., "Rendering," "HD," "4K").

## Components

- **Buttons:**
    - **Primary:** Solid Cyan to Teal gradient background with white `ui-mono` text. No border.
    - **Ghost:** 1px white border (20% opacity) with a hover state that increases background blur and border brightness.
- **Cards:** Use Level 1 elevation. On hover, the 1px border should transition to Primary Cyan.
- **Inputs:** Darker than the surface (#050505), sharp corners (4px), with a `JetBrains Mono` cursor. Focused state reveals a 1px Primary Cyan bottom-border.
- **Progress Bars:** Use a dual-tone gradient (Cyan to Teal). The background of the track should be a "dimmed" version of the primary color (10% opacity).
- **Timeline / Scrubber:** High-contrast Amber for the playhead to ensure immediate visibility against the dark interface.
- **Chips:** Small, `label-caps` typography, with a subtle dark grey background and no border. Used for tagging media types (e.g., RAW, LOG, MP4).