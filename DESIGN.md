---
name: Fly Crew Experience
description: Premium aviation training brand site
colors:
  primary: "#D4AF37"
  secondary: "#0B1F33"
  neutral: "#F7F7F5"
  muted: "#AEB7C1"
  background: "#111111"
typography:
  display:
    fontFamily: "Cinzel, serif"
    fontSize: "clamp(2.5rem, 7vw, 4.5rem)"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "normal"
  body:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
    textTransform: "uppercase"
rounded:
  sm: "calc(0.5rem - 4px)"
  md: "calc(0.5rem - 2px)"
  lg: "0.5rem"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
    padding: "1rem 2rem"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
    padding: "1rem 2rem"
  input-default:
    backgroundColor: "{colors.background}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
  input-focused:
    backgroundColor: "{colors.background}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
  card-default:
    backgroundColor: "{colors.background}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
---

# Design System: Fly Crew Experience

## 1. Overview

**Creative North Star: "The Aviation Atelier"**

Elegant, secure, refined, and welcoming. Whispers rather than shouts — no exaggeration, no loud marketing. Inspired, human, sophisticated without being cold. Refined & tonal elevation philosophy (consistent with "marcas premium sussurram, não gritam" — sombras pesadas/táteis tendem a contradictar essa filosofia de discrição).

Key Characteristics:
- Primary colors: Gold Prestige and Midnight Premium
- Neutral palette: Cloud White, Silver Mist, Executive Black
- Typography: Cinzel for headlines, Montserrat for body, Inter for UI labels
- Refined, tonal elevation without heavy shadows
- Component restraint: subtle interactions, refined proportions

## 2. Colors

The palette balances authority and excellence with premium neutrality, evoking aviation trust and aspirational achievement.

### Primary
- **Gold Prestige** (#D4AF37): Used for accents, call-to-action buttons, highlights, and premium details across the site.

### Secondary
- **Midnight Premium** (#0B1F33): Used for secondary backgrounds, navigation elements, and deep tonal layers.

### Neutral
- **Cloud White** (#F7F7F5): Primary foreground/text color on dark backgrounds; also used for card backgrounds in light mode.

### Muted
- **Silver Mist** (#AEB7C1): Used for secondary text, subtle borders, and disabled states.

### Background
- **Executive Black** (#111111): Main background color; provides depth and contrast for foreground elements.

### The Refined Tonal Rule
Elevation is conveyed through tonal layering and subtle transparency rather than heavy shadows; shadows appear only as ambient glows on interactive states.

## 3. Typography

**Display Font:** Cinzel (with serif fallback)
**Body Font:** Montserrat (with sans-serif fallback)
**Label/Mono Font:** Inter (with sans-serif fallback)

**Character:** Pairing Cinzel’s institutional gravitas with Montserrat’s neutral readability creates a sophisticated yet accessible hierarchy; Inter provides clarity for functional UI elements without compromising the brand’s editorial voice.

### Hierarchy
- **Display** (300, clamp(2.5rem, 7vw, 4.5rem), 1): Institutional headlines, campaign titles, premium section headings.
- **Body** (400, 1rem, 1.6): Primary prose content, descriptions, and body copy throughout the site.
- **Label** (500, 0.875rem, 1.4, 0.05em, uppercase): UI labels, form fields, navigation items, and metadata requiring subtle emphasis.

### The Hierarchy Clarity Rule
Display sizes scale fluidly with viewport width to ensure impact across devices while maintaining editorial proportion; body text maintains comfortable line length (65–75ch) for readability.

## 4. Elevation

The system uses a refined tonal layering approach; shadows are minimal and reserved for interactive feedback, with depth primarily conveyed through value contrasts, transparency, and subtle elevation changes.

### Shadow Vocabulary (if applicable)
- **Ambient Low Hover Glow** (`0 4px 12px rgba(212, 175, 55, 0.15)`): Soft gold prestige glow on interactive elements like buttons and cards on hover/focus.

### The Tonal Primacy Rule
Surfaces are flat at rest; elevation appears as a response to state (hover, focus, press) through subtle tonal shifts and ambient glows rather than pronounced drop shadows.

## 5. Components

### Buttons
- **Shape:** Rounded lg (8px radius)
- **Primary:** Background: Gold Prestige (#D4AF37), Text: Cloud White (#F7F7F5), Padding: 1rem 2rem
- **Hover / Focus:** Background: Gold Prestige at 90% opacity, optional ambient low hover glow
- **Secondary / Ghost:** Background: transparent, Text: Gold Prestige, Border: 1px solid Gold Prestige/30

### Cards / Containers
- **Corner Style:** Rounded lg (8px)
- **Background:** Executive Black (#111111) in dark mode, Cloud White (#F7F7F5) in light mode
- **Shadow Strategy:** Refer to Elevation section; uses ambient low hover glow for interactive states
- **Border:** None by default; optional 1px solid Silver Mist/20 for subtle separation
- **Internal Padding:** 1.5rem (lg spacing)

### Inputs / Fields
- **Style:** Background: Executive Black (#111111), Text: Cloud White (#F7F7F5), Radius: md (6px), Stroke: 1px solid Silver Mist/30
- **Focus:** Background: Executive Black, Text: Cloud White, Stroke: 2px solid Gold Prestige, Ring: 2px solid Gold Prestige/20
- **Error / Disabled:** Error: Background: Executive Black, Text: Destructive (red variant not defined — use system error), Stroke: Destructive; Disabled: Background: Muted/20, Text: Muted/50, Cursor: not-allowed

### Navigation
- **Style:** Flex container, align items center, space between; background: Executive Black; text: Cloud White; label font: Inter label style; hover: text: Gold Prestige; active: text: Gold Prestige, underline: 2px solid Gold Prestige; mobile treatment: collapses to hamburger menu with same color treatment.

## 6. Do's and Don'ts

### Do:
- **Do** use Gold Prestige (≥30% opacity) for accent elements and calls-to-action; its rarity conveys exclusivity.
- **Do** pair Cinzel headlines with Montserrat body at a minimum 1.25x scale step for hierarchical clarity.
- **Do** keep corner radius consistent at 8px (lg) for cards and buttons to maintain visual rhythm.
- **Do** apply ambient low hover glow only on interactive elements; never use heavy drop shadows.
- **Do** maintain body line length between 65–75ch for optimal readability.

### Don't:
- **Don't** use neon gradients, badges, or aggressive SaaS startup patterns (anti-reference from PRODUCT.md).
- **Don't** pair two similar sans-serifs or two geometric fonts without contrast axis.
- **Don't** animate width, height, or layout properties; limit motion to transform and opacity.
- **Don't** use drop shadows heavier than 4px blur; prefer tonal layering and transparency for elevation.
- **Don't** set body text lighter than 4.5:1 contrast against its background; always verify accessibility.