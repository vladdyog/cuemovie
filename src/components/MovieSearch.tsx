import React, { useCallback, useEffect, useRef, useState } from 'react';

import type { Movie } from '../types';
import { enrichSearchResult, searchMovies } from '../utils/tmdb';
import Button from './ui/Button';
import MovieModal from './ui/MovieModal';

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
  const [focused, setFocused] = useState(false);
  const [previewMovie, setPreviewMovie] = useState<Movie | null>(null);
  const [previewLoading, setPreviewLoading] = useState<number | null>(null);

  const enrichedCache = useRef<Map<number, Movie>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (previewMovie) return;
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [previewMovie]);

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

  const getEnriched = async (result: SearchResult): Promise<Movie> => {
    const cached = enrichedCache.current.get(result.tmdbId);
    if (cached) return cached;
    const enriched = await enrichSearchResult(result);
    enrichedCache.current.set(result.tmdbId, enriched);
    return enriched;
  };

  const handlePreview = async (result: SearchResult) => {
    setPreviewLoading(result.tmdbId);
    const enriched = await getEnriched(result);
    setPreviewLoading(null);
    setPreviewMovie(enriched);
  };

  const handleAdd = async (result: SearchResult) => {
    if (addingId === result.tmdbId || isInList(result)) return;
    setAddingId(result.tmdbId);
    try {
      const enriched = await getEnriched(result);
      onAdd(enriched);
      setAddedIds((prev) => new Set([...prev, result.tmdbId]));
    } finally {
      setAddingId(null);
    }
  };

  const hasResults = focused && results.length > 0;
  const showEmpty =
    focused && !loading && results.length === 0 && query.trim().length > 0;
  const showDropdown = focused && (loading || hasResults || showEmpty);

  return (
    <>
      {/* Full-page overlay */}
      {showDropdown && (
        <div
          onClick={() => setFocused(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 10,
          }}
        />
      )}

      {/* Search container */}
      <div
        ref={containerRef}
        style={{ position: 'relative', zIndex: showDropdown ? 20 : 'auto' }}
      >
        {/* Input bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: showDropdown
              ? 'var(--radius-lg) var(--radius-lg) 0 0'
              : 'var(--radius-lg)',
            transition: 'border-radius 0.15s',
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
            onFocus={() => setFocused(true)}
            onChange={(e) => {
              setFocused(true);
              setQuery(e.target.value);
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text)',
              fontSize: 'var(--text-base)',
              fontWeight:
                'var(--weight-medium)' as React.CSSProperties['fontWeight'],
              fontFamily: 'var(--font-body)',
            }}
          />
        </div>

        {/* Floating dropdown */}
        {showDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderTop: 'none',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
              overflow: 'hidden',
              zIndex: 20,
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            }}
          >
            {loading && (
              <p
                style={{
                  padding: '14px 16px',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-muted)',
                  fontWeight:
                    'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                  textAlign: 'center',
                }}
              >
                Searching...
              </p>
            )}

            {showEmpty && (
              <p
                style={{
                  padding: '14px 16px',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-muted)',
                  fontWeight:
                    'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                  textAlign: 'center',
                }}
              >
                No results for &ldquo;{query.trim()}&rdquo;
              </p>
            )}

            {hasResults &&
              !loading &&
              results.map((result, i) => {
                const inList = isInList(result);
                const justAdded = addedIds.has(result.tmdbId);
                const isAdding = addingId === result.tmdbId;
                const isPreviewing = previewLoading === result.tmdbId;
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
                    {/* Poster + info */}
                    <div
                      onClick={() => handlePreview(result)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1,
                        minWidth: 0,
                        cursor: isPreviewing ? 'wait' : 'pointer',
                        opacity: isPreviewing ? 0.6 : 1,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      <div
                        style={{
                          width: 34,
                          height: 51,
                          flexShrink: 0,
                          borderRadius: 'var(--radius-sm)',
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
                              fontSize: 'var(--text-sm)',
                              opacity: 0.4,
                            }}
                          >
                            🎬
                          </div>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 'var(--text-base)',
                            fontWeight:
                              'var(--weight-bold)' as React.CSSProperties['fontWeight'],
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
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-text-secondary)',
                            fontWeight:
                              'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                            marginTop: '2px',
                          }}
                        >
                          {result.year ?? '-'}
                          {result.rating
                            ? ` · ★ ${result.rating.toFixed(1)}`
                            : ''}
                        </p>
                      </div>
                    </div>

                    {/* Add button */}
                    <Button
                      variant={done ? 'surface' : 'secondary'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdd(result);
                      }}
                      disabled={done || isAdding}
                      style={
                        done
                          ? {
                              color: 'var(--color-muted)',
                              borderColor: 'var(--color-border)',
                            }
                          : {}
                      }
                    >
                      {isAdding
                        ? '…'
                        : justAdded
                          ? 'Added ✓'
                          : inList
                            ? 'In list'
                            : '+ Add'}
                    </Button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewMovie && (
        <MovieModal
          movie={previewMovie}
          onClose={() => setPreviewMovie(null)}
        />
      )}
    </>
  );
}

export default MovieSearch;
