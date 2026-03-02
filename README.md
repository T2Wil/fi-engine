# Rwanda Lifestyle & Income Dashboard

A **local-first**, **chat-driven**, **open-source** web tool to compare your income and expenses against Rwanda districts and lifestyle tiers. All computation runs in your browser; data is stored locally (IndexedDB).

## Features

- **User inputs** (persisted locally): net worth, monthly income, monthly expenses (RWF)
- **Lifestyle tier**: Lean (57k–160k), Middle (161k–650k), Upper (650k–2.5M), Higher (2.5M+)
- **District affordability**: Income / comfortable cost per district → Strained (&lt;1×), Stable (1–1.5×), Strong (&gt;1.5×)
- **Interactive bar chart**: Districts vs comfortable cost bands, with your income as a reference line
- **Interactive Rwanda map**: Leaflet + GeoJSON, districts color-coded by affordability; click for ratio
- **Chat-style insight panel**: Text insights (savings rate, tier, district ranking) as if from your future FI self

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS (Ruixen Moon–style dark theme)
- **Charts**: Recharts
- **Map**: Leaflet.js + react-leaflet, Rwanda ADM2 GeoJSON (geoBoundaries)
- **Storage**: IndexedDB via Dexie.js

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. **Enable GitHub Pages** in the repo: **Settings → Pages → Build and deployment → Source**: **GitHub Actions**.
2. Push the `main` branch (or run the workflow manually: **Actions → Deploy to GitHub Pages → Run workflow**).
3. After the workflow finishes, the site is at **https://\<username\>.github.io/fi-engine/**.

If your repo name is not `fi-engine`, set the base path in `vite.config.ts`: change `"/fi-engine/"` to `"/your-repo-name/"`, and set the same in `.github/workflows/deploy.yml` (env `GITHUB_PAGES` is used to trigger the correct base at build time).

**If you get 404**

- Use **https://t2wil.github.io/fi-engine/** (with trailing slash). Do not open `https://t2wil.github.io/` (root) or `.../index.html`; the app is only published at `.../fi-engine/`.
- In **Settings → Pages**, set **Source** to **GitHub Actions** (not “Deploy from a branch”). If the browser requests `/src/main.tsx` and 404s, the wrong page is being served (repo source instead of the built site); set Source to GitHub Actions, then push and open https://t2wil.github.io/fi-engine/.
- In **Actions**, confirm the “Deploy to GitHub Pages” workflow completed successfully after your last push.

## Project structure

- `src/data/districtCostBands.ts` — District cost bands (high/medium/low) and GeoJSON URL
- `src/engine/computation.ts` — Core engine: lifestyle tier, savings rate, affordability ratios
- `src/db/indexedDb.ts` — Dexie schema and helpers for persisting inputs
- `src/components/` — UserInputForm, IncomeChart, RwandaMap, InsightChatPanel, RayBackground
- `src/App.tsx` — Layout and data flow

## Offline / local-first

- All logic runs client-side; no server required.
- Inputs are stored in IndexedDB and restored on load.
- The map uses a bundled simplified GeoJSON at `public/rwanda-districts.geojson` (same-origin, no CORS). For more detailed district boundaries, download [geoBoundaries RWA ADM2](https://www.geoboundaries.org/api/current/gbOpen/RWA/ADM2/) and replace that file (or point `RWANDA_DISTRICTS_GEOJSON_URL` in `src/data/districtCostBands.ts` to it if hosting elsewhere).

## License

Open-source. District data: geoBoundaries (CC BY 4.0).
