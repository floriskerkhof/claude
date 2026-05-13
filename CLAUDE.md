# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This is a personal projects monorepo by Floris Kerkhof. It contains two types of output:

1. **Static HTML tools** (`docs/`) — single-file, fully client-side interactive pages deployed via GitHub Pages at `https://floriskerkhof.github.io/claude/`
2. **React Native / Expo apps** (`scrl/`, `yen-to-eur/`) — mobile apps built with Expo, targeting Android and iOS

There are no shared dependencies between the two types. Each Expo app is self-contained with its own `package.json`.

---

## Static HTML pages (`docs/`)

### Stack
- **Chart.js 4.4.0** (CDN) — bar/line charts
- **Plotly.js 2.26.0** (CDN) — heatmaps and 3D plots
- **MathJax 3** (CDN) — LaTeX formula rendering
- No build step. Each page is a single `.html` file with all CSS and JS inline.

### Design system (dark theme)
All pages share the same CSS custom properties:
```css
--bg:#07090f  --surface:#0d1117  --surface2:#161b27  --surface3:#1e2637
--border:#2a3347  --text:#e2e8f0  --muted:#7a8faa
--accent:#4a9eff  --accent2:#7bc4ff  --green:#22d3a0  --red:#f87171
--yellow:#fbbf24  --purple:#a78bfa  --orange:#fb923c
```

### Chart.js rules (avoids known layout bugs)
- **Always** wrap every `<canvas>` in `<div style="position:relative;height:Xpx">` and set `maintainAspectRatio:false` on the chart config. Without this, Chart.js fights CSS constraints and the chart collapses on scroll/resize.
- Charts initialised while their container has `display:none` (e.g. inside inactive tabs) measure 0×0. Defer their `init` calls to `requestAnimationFrame` and call `chart.resize()` inside `setTab()` also via `requestAnimationFrame`.
- Set `animation:false` and `tooltip:{enabled:false}` on charts where a cursor plugin or live breakdown table replaces the default tooltip.
- Attach a global `window.resize` handler that calls `.resize()` on all chart instances.

### Deploying
GitHub Pages serves from `docs/`. Merging to `main` deploys automatically — no build step needed.

---

## Expo apps

### Running locally
```bash
cd scrl          # or yen-to-eur
npm install
npm run start    # Expo dev server (opens QR for Expo Go)
npm run android  # Android
npm run ios      # iOS
```

### `scrl` — photo scrapbook / collage editor
Entry: `scrl/App.tsx` → `src/screens/EditorScreen.tsx`

- `EditorScreen` owns all state (placed photos, selected template, canvas dimensions)
- `ScrapbookCanvas` renders the collage and handles drag/resize/layer interactions
- `TemplatePicker` lets the user choose a layout template
- `PhotoSlotTap` handles tapping an empty slot to pick a photo
- Templates defined in `src/templates/index.ts`
- Uses `expo-image-picker`, `expo-media-library`, `expo-sharing`, `react-native-view-shot`

### `yen-to-eur` — JPY → EUR price scanner
Entry: `yen-to-eur/App.tsx`; single-screen app.

- Uses `expo-camera` for the live viewfinder
- Uses `react-native-mlkit-ocr` for on-device OCR (Japanese + English)
- Fetches live JPY/EUR rate from `open.er-api.com` on load
- Regex `(?:[¥￥]\s*([0-9][0-9,]+)|([0-9][0-9,]+)\s*[円H])/g` extracts yen prices
- A parallel web version lives at `docs/index.html` (uses Tesseract.js instead of MLKit)

### Building an Android APK
The CI workflow (`.github/workflows/build-android.yml`) runs on push to `main`:
```bash
cd yen-to-eur
npm install
npx expo prebuild --platform android --no-install
cd android
./gradlew assembleRelease
```
APK is uploaded as a GitHub Actions artifact named `yen-to-eur`.

---

## Financial tools context (docs/sabr.html, docs/pnl-explainer.html)

These pages are interactive finance educators, not calculators for production use.

### Shared model: Normal (Bachelier) swaption pricing
Used in `pnl-explainer.html` for all Greeks. Rates are modelled as arithmetic Brownian motion (supports negative rates):
```
V = A · [(F−K)·N(d) + σ_N√T·n(d)],  d = (F−K)/(σ_N√T)
```
Greeks are dollar-scaled by `notional × BP` (BP = 0.0001).

### PnL explain structure
Taylor expansion:  `ΔP ≈ DV01·ΔR + ½Γ(ΔR)² + ν·Δσ + ½𝒱(Δσ)² + 𝒜·ΔR·Δσ + Θ·Δt`

- **Hessian** — 5×5 matrix of cross-gammas across tenor nodes [1Y, 2Y, 5Y, 10Y, 30Y]; built by interpolating swaption expiry and end-date weights onto those nodes
- **Actual PnL** — full Bachelier revaluation at shifted inputs
- **Unexplained** — Actual minus sum of all Taylor terms (third-order+ residual)

### Page design pattern
All `docs/` pages follow this section order:
1. Hero — story-driven problem statement (concrete dollar amounts, morning-desk scenario)
2. Concept with blue callout box explaining *why it matters*
3. Interactive chart / control panel
4. Live breakdown table (not a tooltip)
5. Collapsible "deep dive" with LaTeX formula
6. Glossary at the bottom with hover tooltips

The hero sub-heading should open with the concrete problem the user faces, not an abstract description of what the tool does.

---

## Git workflow

- Development branch pattern: `claude/<feature>-<id>`
- GitHub Pages deploys from `main/docs/`
- After merging a feature branch, create a new PR for any subsequent commits (old PRs are closed)
