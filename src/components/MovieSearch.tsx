import React, { useCallback, useEffect, useRef, useState } from 'react';

import type { Movie } from '../types';
import { addMovieFromSearch, searchMovies } from '../utils/tmdb';

// Infer the result shape from the return type of searchMovies so this
// component doesn't depend on MovieSearchResult being exported from tmdb.ts.
type SearchResult = Awaited<ReturnType<typeof searchMovies>>[number];

interface MovieSearchProps {
  movies: Movie[];
  onAdd: (movie: Movie) => void;
}

function MovieSearch({ movies, onAdd }: MovieSearchProps): React.ReactElement {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const res = await searchMovies(q);
      setResults(res);
      setLoading(false);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const isInList = useCallback(
    (result: SearchResult) =>
      movies.some(
        (m) =>
          m.title.toLowerCase() === result.title.toLowerCase() &&
          m.year === result.year,
      ),
    [movies],
  );

  const handleAdd = async (result: SearchResult) => {
    if (addingId === result.tmdbId || isInList(result)) return;
    setAddingId(result.tmdbId);
    try {
      const movie = await addMovieFromSearch(result);
      onAdd(movie);
      setAddedIds((prev) => new Set([...prev, result.tmdbId]));
    } finally {
      setAddingId(null);
    }
  };

  const hasResults = results.length > 0;
  const showEmpty = !loading && !hasResults && query.trim().length > 0;
  const showBorder = loading || hasResults || showEmpty;

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Input row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 14px',
          borderBottom: showBorder ? '1px solid var(--color-border)' : 'none',
        }}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search for a movie to add..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
            fontWeight: 500,
            fontFamily: 'var(--font-body)',
          }}
        />
      </div>

      {/* Loading */}
      {loading && (
        <p
          style={{
            padding: '14px 16px',
            fontSize: '0.825rem',
            color: 'var(--color-muted)',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          Searching...
        </p>
      )}

      {/* No results */}
      {showEmpty && (
        <p
          style={{
            padding: '14px 16px',
            fontSize: '0.825rem',
            color: 'var(--color-muted)',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          No results for &ldquo;{query.trim()}&rdquo;
        </p>
      )}

      {/* Results */}
      {hasResults && !loading && (
        <div>
          {results.map((result, i) => {
            const inList = isInList(result);
            const justAdded = addedIds.has(result.tmdbId);
            const isAdding = addingId === result.tmdbId;
            const done = inList || justAdded;

            return (
              <div
                key={result.tmdbId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderBottom:
                    i < results.length - 1
                      ? '1px solid var(--color-border)'
                      : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.background =
                    'var(--color-surface-2)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLDivElement).style.background =
                    'transparent')
                }
              >
                {/* Poster thumbnail */}
                <div
                  style={{
                    width: 34,
                    height: 51,
                    flexShrink: 0,
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {result.poster ? (
                    <img
                      src={result.poster}
                      alt={result.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        opacity: 0.4,
                      }}
                    >
                      🎬
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {result.title}
                  </p>
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-secondary)',
                      fontWeight: 500,
                      marginTop: '2px',
                    }}
                  >
                    {result.year ?? '—'}
                    {result.rating ? ` · ★ ${result.rating.toFixed(1)}` : ''}
                  </p>
                </div>

                {/* Add button */}
                <button
                  onClick={() => handleAdd(result)}
                  disabled={done || isAdding}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: '1px solid',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-body)',
                    cursor: done || isAdding ? 'default' : 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                    letterSpacing: '0.01em',
                    ...(done
                      ? {
                          borderColor: 'var(--color-border)',
                          background: 'transparent',
                          color: 'var(--color-muted)',
                        }
                      : isAdding
                        ? {
                            borderColor: 'var(--color-border)',
                            background: 'transparent',
                            color: 'var(--color-muted)',
                          }
                        : {
                            borderColor: 'var(--color-accent)',
                            background: 'transparent',
                            color: 'var(--color-accent)',
                          }),
                  }}
                  onMouseEnter={(e) => {
                    if (!done && !isAdding) {
                      e.currentTarget.style.background = 'rgba(255,128,0,0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!done && !isAdding) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {isAdding
                    ? '…'
                    : justAdded
                      ? 'Added ✓'
                      : inList
                        ? 'In list'
                        : '+ Add'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MovieSearch;
