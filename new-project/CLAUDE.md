# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

Personal projects monorepo by Floris Kerkhof. Two output types:

1. **Static HTML tools** (`docs/`) — single-file, fully client-side interactive pages at `https://floriskerkhof.github.io/claude/`
2. **React Native / Expo apps** (`scrl/`, `yen-to-eur/`) — mobile apps built with Expo

GitHub Pages serves from `docs/`. Merging to `main` deploys automatically — no build step.

---

## Building interactive HTML educator pages (`docs/`)

This is the primary creative output of the repo. Each page is a self-contained `.html` file with all CSS and JS inline. No build step, no bundler.

### Stack (CDN only)
- **Chart.js 4.4.0** — bar/line/scatter charts
- **Plotly.js 2.26.0** — heatmaps, 3D surfaces
- **MathJax 3** — LaTeX formula rendering

### Design system — dark theme
Always use these CSS custom properties. Never invent new colours.
```css
:root {
  --bg:#07090f;  --surface:#0d1117;  --surface2:#161b27;  --surface3:#1e2637;
  --border:#2a3347;  --text:#e2e8f0;  --muted:#7a8faa;
  --accent:#4a9eff;  --accent2:#7bc4ff;  --green:#22d3a0;  --red:#f87171;
  --yellow:#fbbf24;  --purple:#a78bfa;  --orange:#fb923c;  --r:10px;
}
```

---

## Page content philosophy — the most important rules

These rules exist because users consistently said they couldn't understand what they were looking at or why it was useful. Every section must pass two tests before it is finished:

1. **Does it say WHY before WHAT?** A section that only explains what something is fails. It must first answer: why does a real person on a real desk need to know this?
2. **Does it use concrete numbers?** Abstract definitions ("DV01 measures rate sensitivity") are weak. Concrete scenarios ("your DV01 is $5,000 — rates moved 10bp — you should have made $500k. Did you?") are strong.

### Hero section
- Sub-heading must open with the **concrete problem the user faces**, not a description of the tool.
- Good: *"Your swaption made $1.4M today. Your risk system predicted $900k. Where did the extra $500k come from — and should you be worried?"*
- Bad: *"This tool lets you decompose PnL into first- and second-order Greeks."*
- Always include a **blue callout box** with a named real-world scenario (morning desk, end-of-day risk check, etc.) that sets the stakes.
- Three summary cards below: frame as outcomes/questions, not as feature labels.
- Include a "How to use this tool" collapsible (open by default) with numbered steps linking to each section by anchor.

### Every subsequent section
- Open with a `<p class="lead">` that states the practical problem this section solves.
- Follow with a **blue callout box** (`background:rgba(74,158,255,.06); border:1px solid rgba(74,158,255,.18)`) that answers "why does a trader/risk manager care about this specifically?"
- Then the interactive element.
- Then a **live breakdown table** (never a tooltip) showing the term-by-term calculation at the current slider position.
- Then a collapsible "deep dive" with the LaTeX formula and derivation.

### Glossary (every page)
Always end with a glossary strip of hover-tooltip terms. Minimum 8–12 terms. Tooltip copy should be one sentence max and use concrete units (e.g. "$/bp", "$/bp²").

### Scenarios section
Every page should have 4–5 named scenarios that load preset slider values. Frame each scenario as a real desk story, not just a parameter set. Each card should have: icon, name, 2-sentence description explaining what happens and why it's interesting, and chip labels showing the key parameter values.

---

## Chart.js rules — avoids known layout bugs

These are hard constraints. Violating them causes charts to collapse or animate incorrectly:

- **Always** wrap every `<canvas>` in `<div style="position:relative;height:Xpx">` and set `maintainAspectRatio:false`. Without this, Chart.js fights CSS and the chart collapses on scroll/resize.
- Charts initialised inside a `display:none` container (e.g. inactive tabs) measure 0×0. Defer `init` to `requestAnimationFrame` and call `chart.resize()` inside `setTab()` also via `requestAnimationFrame`.
- Set `animation:false` on all charts. Set `tooltip:{enabled:false}` wherever a live breakdown table replaces the tooltip.
- Attach a `window.addEventListener('resize', ...)` that calls `.resize()` on every chart instance.

---

## Financial context (docs/sabr.html, docs/pnl-explainer.html)

### Normal (Bachelier) swaption model
Used for Greeks in `pnl-explainer.html`. Rates modelled as arithmetic Brownian motion (supports negative rates):
```
V = A · [(F−K)·N(d) + σ_N√T·n(d)],  d = (F−K)/(σ_N√T)
```
Greeks dollar-scaled by `notional × BP` (BP = 0.0001).

### PnL explain Taylor expansion
`ΔP ≈ DV01·ΔR + ½Γ(ΔR)² + ν·Δσ + ½𝒱(Δσ)² + 𝒜·ΔR·Δσ + Θ·Δt`

Hessian = 5×5 cross-gamma matrix across tenor nodes [1Y, 2Y, 5Y, 10Y, 30Y]. Unexplained = Actual (full revaluation) minus sum of Taylor terms.

---

## Expo apps (secondary)

```bash
cd scrl   # or yen-to-eur
npm install && npm run start
```

- `scrl` — photo collage editor. State in `EditorScreen`, rendering in `ScrapbookCanvas`, templates in `src/templates/index.ts`.
- `yen-to-eur` — JPY→EUR camera scanner using `react-native-mlkit-ocr`. Web parallel at `docs/index.html` uses Tesseract.js.

---

## Git workflow

- Branch pattern: `claude/<feature>-<id>`
- After a PR is merged, open a new PR for subsequent commits — closed PRs cannot be reopened with new commits.
