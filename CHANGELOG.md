# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v0.8.2] - 2026-06-24

### Additions

- **MyList tab** - a dedicated tab to view and manage your watchlist without leaving the app.
  Supports grid and list view modes, pagination, single and bulk removal with confirmation,
  and a select mode for managing multiple entries at once.
- **Movie search** - search for any movie via TMDb and add it directly to your list from the
  My List tab. No CSV required - you can now build a watchlist entirely inside the app.
- **CSV merge** - when importing a CSV, choose whether to replace your current list or merge
  it with movies already in the app.
- **SVG favicon** - added `favicon.svg` with an opaque background so the logo mark remains
  visible in Google search results and other light-background contexts. Existing transparent
  PNG favicons are unchanged for browser tabs and bookmarks.
- **Structured data** - added JSON-LD `WebApplication` schema to help Google understand
  the app and improve rich result eligibility.
- **Theme color** - added `theme-color` meta tag so browsers and OS chrome use the correct
  dark background color.

### Changes

- **Basic Design system** - full token-based refactor across all components: unified `--text-*`
  type scale, `--radius-*` radius scale, `--weight-*` font weight tokens, and tint tokens.
  Codebase reorganised with a `components/ui/` subfolder for primitives.
- `Button` now covers five variants (`primary`, `secondary`, `surface`, `danger`, `toggle`)
  and four sizes (`icon`, `sm`, `md`, `lg`), replacing all one-off button styles.
- New primitive components: `SectionLabel`, `CloseButton` (inset and floating variants),
  and `GenrePill`. All major components migrated to the new token system.

### Improvements

- `sitemap.xml` `lastmod` updated to reflect the current release date.

---

## [v0.8.1] - 2026-05-27

### Additions

- **SEO** - added meta description, Open Graph, and Twitter Card tags to improve
  search engine visibility and social share previews (WhatsApp, iMessage, etc.).
- **Sitemap** - added `sitemap.xml` and `robots.txt` to aid search engine crawling.
- **Security headers** - added `vercel.json` with `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, and `Permissions-Policy` headers across all routes.

### Improvements

- `tmdbFunction` now validates the `path` parameter against an allowlist,
  preventing arbitrary TMDB endpoint access.
- `feedbackFunction` now enforces a 10KB body size limit, validates
  `Content-Type: application/json`, and rejects malformed JSON before forwarding.

---

## [v0.8.0] - 2026-05-26

### Additions

- **Feedback form** - a floating button lets users submit bug reports, feature ideas,
  or general feedback without leaving the app. Optionally include an email for follow-up.
- **CSV export** - download your TMDb-enriched watchlist as an updated CSV file.
- **TMDb attribution** - TMDb logo and required attribution now displayed in the UI.
- **CI pipeline** - automated build and lint checks run on every push.
- **Support button** - Linked a support button for users who enjoy the app and wish to help keep it alive.
- **GitHub Sponsors** - donation link added via FUNDING.yml.

### Changes

- Updated app logo.
- Improved card fan layout in deck mode to better adapt to narrow viewports.
- TMDB API token is no longer exposed in client-side requests - all calls are
  now proxied through a Vercel serverless function.

### Improvements

- Scrollbar width and hover highlight rendering.

---

## [v0.7.1] - 2026-05-12

### Changes

- Improved loading bar appearance while processing CSV files.

### Improvements

- Fixed 429 errors caused by too many requests per second to the TMDb API.

---

## [v0.7.0] - 2026-05-01

### Additions

- Genre exclusion filtering - exclude specific genres from your list.
- In-app guidance on how to export watchlists from IMDb and Letterboxd.
- Vercel Analytics for basic usage tracking.

### Changes

- Redesigned color scheme, typography, and spacing throughout the app.
- Refined deck and last-pick UI for a smoother experience.
- Improved genre filter section styling and interaction.

### Improvements

- Removed animation flicker when reshuffling cards in deck mode.

---

## [v0.6.1] - 2026-04-29

First working end-to-end release, published under the name **CueMovie**.

### Additions

- Upload CSV watchlists from IMDb or Letterboxd, with automatic format detection.
- TMDb enrichment - each movie is supplemented with rating, genres, runtime,
  poster, and overview.
- Filter-based selection - narrow your list before picking.
- Random movie picker from the filtered results.
- Card deck UI for collecting and shuffling multiple candidates to pick a winner,
  replacing the original spin-the-wheel concept.
