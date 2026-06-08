import type { Movie } from '../types';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// ---------------------------------------------------------------------------
// Rate limiter - sliding window, 40 req/s
//
// TMDB's documented limit is 40 requests per 10 s. Their CDN enforces a
// harder ceiling of ~50 req/s. We target 40 req/s - a comfortable margin
// below the CDN cap while respecting the spirit of the documented limit.
//
// JS is single-threaded: the check-and-push in waitForRateLimit() is
// effectively atomic - no race condition is possible between concurrent
// async callers.
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 1_000;
const MAX_REQUESTS_PER_WINDOW = 40; // Pushing the limit, but staying on the safe side with sub-50 requests
const requestTimestamps: number[] = [];

async function waitForRateLimit(): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (
      requestTimestamps.length > 0 &&
      now - requestTimestamps[0] >= RATE_WINDOW_MS
    ) {
      requestTimestamps.shift();
    }
    if (requestTimestamps.length < MAX_REQUESTS_PER_WINDOW) {
      requestTimestamps.push(now);
      return;
    }
    const waitMs = RATE_WINDOW_MS - (now - requestTimestamps[0]) + 1;
    await new Promise<void>((r) => setTimeout(r, waitMs));
  }
}

// ---------------------------------------------------------------------------
// Rate-limited fetch with 429 retry
//
// In development, requests to /api/tmdbFunction are intercepted by Vite's
// proxy (configured in vite.config.ts), which forwards them to TMDB and
// injects the Authorization header server-side - so the token never reaches
// the browser in either environment.
// ---------------------------------------------------------------------------
async function tmdbFetch(
  path: string,
  query: URLSearchParams,
  retries = 3,
): Promise<Response | null> {
  await waitForRateLimit();

  const proxyParams = new URLSearchParams({ path });
  query.forEach((v, k) => proxyParams.set(k, v));

  try {
    const res = await fetch(`/api/tmdbFunction?${proxyParams}`);
    if (res.status === 429) {
      if (retries <= 0) return null;
      const raw = res.headers.get('Retry-After');
      const seconds = raw !== null ? parseFloat(raw) : NaN;
      const waitMs = isNaN(seconds) ? 2_000 : seconds * 1_000;
      await new Promise<void>((r) => setTimeout(r, waitMs));
      return tmdbFetch(path, query, retries - 1);
    }
    return res.ok ? res : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TMDbSearchResult = {
  id: number;
  vote_average: number;
  poster_path: string | null;
  overview: string;
};

type TMDbMovieDetails = {
  runtime: number | null;
  genres: { id: number; name: string }[];
};

export type TMDbEnrichment = {
  rating?: number;
  genres?: string[];
  runtime?: number;
  overview?: string;
  poster?: string;
};

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function searchMovie(
  title: string,
  year: number | undefined,
): Promise<TMDbSearchResult | null> {
  const params = new URLSearchParams({
    query: title,
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  });
  if (year) params.set('year', String(year));

  const res = await tmdbFetch('/search/movie', params);
  if (!res) return null;
  const data = await res.json();
  return (data.results?.[0] as TMDbSearchResult) ?? null;
}

async function fetchMovieDetails(id: number): Promise<TMDbMovieDetails | null> {
  const res = await tmdbFetch(`/movie/${id}`, new URLSearchParams());
  if (!res) return null;
  return res.json() as Promise<TMDbMovieDetails>;
}

export async function enrichMovie(movie: Movie): Promise<TMDbEnrichment> {
  try {
    const result = await searchMovie(movie.title, movie.year);
    if (!result) return {};

    const details = await fetchMovieDetails(result.id);

    return {
      rating: result.vote_average || undefined,
      overview: result.overview || undefined,
      genres: details?.genres.map((g) => g.name) ?? undefined,
      runtime: details?.runtime ?? undefined,
      poster: result.poster_path
        ? `${TMDB_IMAGE_BASE}${result.poster_path}`
        : undefined,
    };
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Bulk enrichment - concurrent worker pool, paced by the rate limiter
//
// Workers pull from a shared index and each call enrichMovie(), which makes
// 2 requests (search + details) both routed through waitForRateLimit().
// Having more workers than the per-second budget is fine - extras simply
// wait their turn. This replaces the old fixed-batch loop, which fired a
// full batch instantly and had no pacing between batches.
// ---------------------------------------------------------------------------
export async function enrichAllMovies(
  movies: Movie[],
  onProgress: (completed: number, total: number) => void,
  concurrency = 50,
): Promise<Movie[]> {
  const enriched: Movie[] = new Array(movies.length);
  let completed = 0;
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < movies.length) {
      const i = nextIndex++; // safe: JS is single-threaded, no await between read & write
      enriched[i] = { ...movies[i], ...(await enrichMovie(movies[i])) };
      onProgress(++completed, movies.length);
    }
  }

  const workerCount = Math.min(concurrency, movies.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return enriched;
}

// ---------------------------------------------------------------------------
// Search & manual add
//
// Append this block to the bottom of your existing src/utils/tmdb.ts.
// Do not replace the file - only add these exports.
// ---------------------------------------------------------------------------

export type MovieSearchResult = {
  tmdbId: number;
  title: string;
  year?: number;
  poster?: string;
  overview?: string;
  rating?: number;
};

type TMDbSearchRaw = {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  overview: string;
  vote_average: number;
};

// Returns up to 6 candidates for a query string. Uses the same tmdbFetch
// and waitForRateLimit machinery as the bulk enrichment path.
export async function searchMovies(
  query: string,
): Promise<MovieSearchResult[]> {
  const params = new URLSearchParams({
    query,
    include_adult: 'false',
    language: 'en-US',
    page: '1',
  });

  const res = await tmdbFetch('/search/movie', params);
  if (!res) return [];

  const data = (await res.json()) as { results?: TMDbSearchRaw[] };
  return (data.results ?? []).slice(0, 6).map((r) => ({
    tmdbId: r.id,
    title: r.title,
    year: r.release_date
      ? parseInt(r.release_date.slice(0, 4), 10) || undefined
      : undefined,
    poster: r.poster_path ? `${TMDB_IMAGE_BASE}${r.poster_path}` : undefined,
    overview: r.overview || undefined,
    rating: r.vote_average || undefined,
  }));
}

// Fetches full details for a chosen search result and returns a Movie ready
// to append to the watchlist. Skips re-searching since we already have the
// TMDB id from the search step.
export async function addMovieFromSearch(
  result: MovieSearchResult,
): Promise<Movie> {
  const details = await fetchMovieDetails(result.tmdbId);
  return {
    title: result.title,
    year: result.year,
    poster: result.poster,
    overview: result.overview,
    rating: result.rating,
    genres: details?.genres.map((g) => g.name) ?? undefined,
    runtime: details?.runtime ?? undefined,
    dateAdded: new Date().toISOString().slice(0, 10),
  };
}
