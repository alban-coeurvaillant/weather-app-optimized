# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- This is a single-file, static web app (vanilla HTML/CSS/JS) for displaying simple weather information with mock data. There are no external dependencies, build steps, or test/lint tooling configured.

Common commands
- Open in browser (macOS):
  - open app.html
- Serve locally over HTTP (recommended):
  - Python (built-in):
    - python3 -m http.server 8000
    - Then open http://localhost:8000/app.html
  - Node (if installed):
    - npx serve -l 8000
    - Then open http://localhost:8000/app.html

Notes on tooling
- Build: none configured.
- Lint/format: none configured.
- Tests: none configured.

High-level architecture
- Single entry/file: app.html contains markup, styles, and script in one place.
- Data model (mocked):
  - weatherData.current: temperature, condition, location, icon URL, daily high/low.
  - weatherData.hourly: array of { time, temp, condition } used to render the hourly forecast strip.
  - weatherData.locations: list of named locations for simple client-side search.
- Rendering flow (on window load):
  - initApp() populates the current conditions UI and renders the hourly forecast from weatherData.hourly.
  - Event wiring: search button click and Enter key on the input both call searchLocation().
- Interaction logic:
  - searchLocation(): finds a matching location (substring match on lowercase name). If found, it updates weatherData.current, recalculates high/low, updates the DOM, and regenerates hourly data via updateHourlyForecast(baseTemp). If not found, shows a simple alert.
  - updateHourlyForecast(baseTemp): creates a new hourly array by sampling random conditions and progressively decreasing temperatures from baseTemp, then re-renders the hourly forecast DOM.
  - getWeatherIcon(condition): currently returns a static placeholder path ("/api/placeholder/..."), so image requests may 404 when served statically; this is expected for the demo.

File of interest
- app.html: contains the entire application, including styles and the following functions: initApp, searchLocation, updateHourlyForecast, getWeatherIcon.
