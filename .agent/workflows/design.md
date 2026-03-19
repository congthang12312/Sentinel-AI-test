---
description: UI/UX design workflow — design systems, wireframes, color palettes, component specs
---

# Design — UI/UX Design Workflow

Create design systems, wireframes, color palettes, and component specifications.

## Usage

```
/design <what to design>
```

## Workflow

### Step 1: Understand Requirements
- Ask about: target audience, brand style, platform (web/mobile), existing design language
- Read `./docs/design-guidelines.md` if it exists
- Check existing UI code for current patterns

### Step 2: Research
- Activate relevant skills:
  - `.agent/skills/ui-styling/SKILL.md` — CSS/styling best practices
  - `.agent/skills/ui-ux-pro-max/SKILL.md` — comprehensive UI/UX patterns
  - `.agent/skills/frontend-design/SKILL.md` — component design
  - `.agent/skills/web-design-guidelines/SKILL.md` — web design standards
- Use `search_web` for design inspiration and trends

### Step 3: Create Design System
Generate `docs/design-guidelines.md` with:
- **Color Palette** — primary, secondary, accent, neutral, semantic colors (with hex/HSL)
- **Typography** — font families, sizes, weights, line heights
- **Spacing** — consistent spacing scale (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
- **Border Radius** — consistent rounding scale
- **Shadows** — elevation levels
- **Breakpoints** — responsive design breakpoints
- **Dark Mode** — if applicable

### Step 4: Component Specs
For each component:
- States: default, hover, active, focus, disabled, loading, error
- Sizes: sm, md, lg variants
- Accessibility: ARIA labels, keyboard navigation, contrast ratios
- Responsive behavior

### Step 5: Wireframes (if requested)
- Create wireframes as HTML files in `./docs/wireframes/`
- Keep them functional and clear for developers

### Step 6: Deliver
- Present design system for user review
- Generate Tailwind config or CSS variables based on design tokens
- Ask if user wants to proceed to implementation

## Principles
- Mobile-first responsive design
- WCAG 2.1 AA accessibility compliance
- Consistent spacing and typography scales
- Dark mode support by default
