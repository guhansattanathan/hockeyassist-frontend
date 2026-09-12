# Hockey Assist — Frontend

A React-based dashboard for exploring NBA player analytics. It consumes the Hockey Assist backend API to display career trajectories, shooting efficiency, advanced metrics, shot charts, and archetype comparisons through interactive D3 and Recharts visualizations.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Component Breakdown](#component-breakdown)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Styling Approach](#styling-approach)
- [API Integration](#api-integration)
- [Development Notes](#development-notes)
- [Known Issues](#known-issues)
- [License](#license)

---

## Overview

Hockey Assist's frontend turns raw NBA statistics into a set of visual, interactive dashboards. Users can search for any active player, view their career arc, compare their shooting efficiency against league averages, explore shot distributions across the court, and see how they fit within the league's "two-way" archetype landscape.

The interface is built around a single-page layout: a search bar that drives a player dashboard, with each chart rendering independently and updating as new players are selected.

---

## Features

- **Player search with autocomplete.** Debounced search across the full player database with a dropdown of matching results.
- **Career trajectory chart.** Per-season totals for points, rebounds, and assists with toggleable series.
- **Season averages chart.** Per-game averages (PPG, RPG, APG) rendered as an area chart.
- **Games played chart.** Durability visualization with tiered color coding and award-eligibility reference lines.
- **Shooting efficiency chart.** Field goal, three-point, and free throw percentages by season.
- **Advanced metrics radar chart.** Usage Rate, True Shooting %, Effective FG %, Assist Rate, and Rebound Rate benchmarked against league averages.
- **Shot chart (horizontal court).** Zone heatmap and scatter views of every shot a player has taken, with season filtering.
- **Two-way archetype Venn diagram.** Interactive three-circle classification of the league by scoring, rebounding, and playmaking thresholds.
- **Headshot integration.** Player profile images from NBA CDN with graceful fallback.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Styling | TailwindCSS |
| Charts | Recharts, D3, d3-hexbin |
| HTTP Client | Axios |
| Build Tool | Create React App (react-scripts) |
| Fonts | Cinzel (headers), JetBrains Mono (numeric) |

---

## Project Structure

```
hockey-assist-frontend/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   ├── basketball-player.png
│   └── default-avatar.png
├── src/
│   ├── components/
│   │   ├── Search/
│   │   │   └── PlayerSearch.jsx
│   │   ├── Dashboard/
│   │   │   └── PlayerDashboard.jsx
│   │   └── Charts/
│   │       ├── CareerTrajectory.jsx
│   │       ├── SeasonAveragesChart.jsx
│   │       ├── GamesPlayedChart.jsx
│   │       ├── EfficiencyChart.jsx
│   │       ├── EfficiencyRadarChart.jsx
│   │       ├── HorizontalCourtChart.jsx
│   │       └── TwoWayVennChart.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

---

## Component Breakdown

### `PlayerSearch.jsx`

Handles player lookup with a debounced query (300ms) against `/api/stats/players/search`. Displays a dropdown of matches with name, team, and position. On selection, notifies the parent via `onPlayerSelect`.

### `PlayerDashboard.jsx`

The orchestrator. Given a selected player, it fans out to four backend endpoints in parallel:

- `/players/{id}/seasons`
- `/players/{id}/averages/seasons`
- `/players/{id}/career`
- `/players/{id}/shots`

Renders the player profile banner, four animated stat cards, and every chart component below.

### `CareerTrajectory.jsx`

An area chart of per-season point, rebound, and assist totals. Each series can be toggled on or off. Uses Recharts with custom gradient fills.

### `SeasonAveragesChart.jsx`

An area chart of per-game averages (PPG, RPG, APG) sourced from the `player_season_averages` table. Falls back to raw season data if averages are unavailable.

### `GamesPlayedChart.jsx`

A bar chart of games played per season, color-coded into three durability tiers:

- Green: 70+ games
- Orange: 50–69 games
- Red: under 50 games

Includes reference lines for the 82-game full season and the 65-game award eligibility threshold.

### `EfficiencyChart.jsx`

A grouped bar chart of Field Goal %, 3-Point %, and Free Throw % per season. Toggleable series with hover highlighting.

### `EfficiencyRadarChart.jsx`

A five-axis radar chart comparing a player's advanced metrics against league averages:

| Metric | League Avg |
|--------|-----------|
| Usage Rate | 20.0 |
| True Shooting % | 57.0 |
| Effective FG % | 54.0 |
| Assist Rate | 18.0 |
| Rebound Rate | 10.0 |

Includes a season selector when multiple seasons are available, plus dynamic insight cards that describe the player's primary strength and focus area based on their metrics.

### `HorizontalCourtChart.jsx`

A full-court shot chart with two view modes:

- **Zones:** Court partitioned into 11 analytical zones with a heatmap color scale based on field goal percentage.
- **Scatter:** Individual shot attempts plotted at their court coordinates, color-coded by make/miss.

Uses the D3 hexbin library and a custom coordinate system that maps NBA shot coordinates (`LOC_X`, `LOC_Y`) to a horizontal half-court pixel grid. Includes a season dropdown when multiple seasons exist.

### `TwoWayVennChart.jsx`

A three-circle Venn diagram classifying players by scoring, rebounding, and playmaking thresholds. Users can adjust each threshold with stepper controls and see the distribution shift in real time.

Uses `d3-force` to lay out player dots with collision detection so they don't overlap. Hover any dot to see the player's name, team, and per-game averages.

**Region categories:**

| Region | Meaning |
|--------|---------|
| Scoring only | Above PPG threshold, below others |
| Rebounding only | Above RPG threshold, below others |
| Playmaking only | Above APG threshold, below others |
| Scorer + Rebounder | Above PPG and RPG |
| Scorer + Playmaker | Above PPG and APG |
| Rebounder + Playmaker | Above RPG and APG |
| All three | Triple-threat — the elite center |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- The Hockey Assist backend running at `http://localhost:8080`

### Install Dependencies

```bash
npm install
```

### Start the Development Server

```bash
npm start
```

The app opens at [http://localhost:3000](http://localhost:3000).

---

## Environment Configuration

Create a `.env` file in the project root to override the backend URL:

```bash
REACT_APP_API_URL=http://localhost:8080
```

If omitted, the app defaults to `http://localhost:8080`.

For production, create `.env.production`:

```bash
REACT_APP_API_URL=https://your-backend-domain.com
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Runs the app in development mode with hot reload |
| `npm run build` | Builds the production bundle into `build/` |
| `npm test` | Runs the test runner in watch mode |
| `npm run eject` | Ejects from Create React App (irreversible) |

---

## Styling Approach

The frontend uses TailwindCSS with a small set of custom utility classes defined in `index.css`:

- `.font-serif-header` — Cinzel serif for headings
- `.font-mono-sub` — JetBrains Mono for numeric displays
- `.vibrant-hover-lift` — subtle lift and glow on hover
- `.subtitle-hover-box` — expanding outline on hero subtitle

The visual language is dark-mode-first. Charts use pitch-black backgrounds with orange, sky-blue, purple, and emerald accents. The header and hero section use a distinct dark-to-darker gradient to separate them from the light dashboard area.

### Color Palette

| Usage | Color |
|-------|-------|
| Primary accent | `#f97316` (orange) |
| Secondary | `#38bdf8` (sky) |
| Tertiary | `#c084fc` (purple) |
| Positive | `#10b981` (emerald) |
| Negative | `#ef4444` (red) |
| Neutral text | `#71717a` (zinc-500) |
| Background | `#000000` (pure black for charts) |

---

## API Integration

All requests go through a shared Axios instance in `src/services/api.js`:

```javascript
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/stats`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});
```

### Methods Exposed

| Method | Endpoint |
|--------|----------|
| `getAllPlayers` | `GET /players` |
| `getPlayerById` | `GET /players/{id}` |
| `getPlayerSeasons` | `GET /players/{id}/seasons` |
| `getPlayerSeasonsAverages` | `GET /players/{id}/averages/seasons` |
| `getCareerTotals` | `GET /players/{id}/career` |
| `getCareerAverages` | `GET /players/{id}/averages` |
| `searchPlayers` | `GET /players/search?query=` |
| `getAllTeams` | `GET /teams` |
| `getAdvancedMetrics` | `GET /players/{id}/advanced/seasons` |
| `getPlayerShots` | `GET /players/{id}/shots?season=` |
| `getLeagueLeaders` | `GET /leaders/{season}/{stat}` |
| `comparePlayers` | `GET /compare?player1=&player2=` |
| `getTwoWayVenn` | `GET /players/venn/two-way?season=` |

An Axios response interceptor logs errors to the console for debugging.

---

## Development Notes

### Data Flow

```
App.jsx
  └── selectedPlayer (state)
      ├── PlayerSearch  →  onPlayerSelect(player)
      └── PlayerDashboard(player)
              ├── fetch seasons
              ├── fetch averages
              ├── fetch career totals
              ├── fetch shot data
              └── render all chart components
```

### Chart Component Contract

Each chart component is designed to be self-contained. It accepts a `seasons`, `shots`, or `playerId` prop and handles its own state, loading, and error cases. This keeps `PlayerDashboard` focused on orchestration.

### Coordinate System

The shot chart uses a unified coordinate mapper for both zone polygons and scatter dots:

```javascript
const nbaToPixel = (nbaX, nbaY) => {
  const px = LEFT_BASKET_X + nbaY + 52.5;
  const py = BASKET_Y - nbaX;
  return [px, py];
};
```

This ensures zone boundaries and shot positions stay aligned regardless of which view mode is active.

---

## Known Issues

- **Duplicate shot data.** If the backend ingests the same shot twice, the frontend will render duplicate scatter dots. Fixed by the backend's unique constraint on `(game_id, game_event_id)`.
- **NBA API rate limits.** Large shot charts (thousands of dots) can cause slight render lag on lower-end devices. Consider virtualization for datasets above 5,000 points.
- **Venn diagram relayout.** Adjusting thresholds re-runs the force simulation, which can produce slightly different dot positions each time. This is expected behavior and does not affect the underlying data.

---

## License

This project is for educational and portfolio purposes. NBA data is fetched from NBA.com via the Hockey Assist backend. All trademarks belong to their respective owners.