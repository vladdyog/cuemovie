import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

import type { Movie } from '../types';
import CSVUpload from './CSVUpload';
import MovieModal from './MovieModal';
import MovieSearch from './MovieSearch';
import WatchlistGrid from './WatchlistGrid';
import WatchlistListView from './WatchlistListView';

type ViewMode = 'grid' | 'list';
type ImportMode = 'merge' | 'replace';

type Props = {
  movies: Movie[];
  isEnriching: boolean;
  progress: { completed: number; total: number } | null;
  enrichmentTime: number | null;
  error: string | null;
  onAddMovie: (movie: Movie) => void;
  onRemoveMovie: (movie: Movie) => void;
  onMoviesLoaded: (movies: Movie[], mode: ImportMode) => void;
  onExport: () => void;
  onClearError: () => void;
};

// ── Icon buttons ─────────────────────────────────────────────────────────────

const GridIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {[
      [0, 0],
      [6, 0],
      [12, 0],
      [0, 6],
      [6, 6],
      [12, 6],
      [0, 12],
      [6, 12],
      [12, 12],
    ].map(([x, y], i) => (
      <rect
        key={i}
        x={x}
        y={y}
        width="4"
        height="4"
        rx="1"
        fill={active ? 'var(--color-text)' : 'var(--color-muted)'}
      />
    ))}
  </svg>
);

const ListIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {[2, 7, 12].map((y, i) => (
      <rect
        key={i}
        x="0"
        y={y}
        width="16"
        height="2"
        rx="1"
        fill={active ? 'var(--color-text)' : 'var(--color-muted)'}
      />
    ))}
  </svg>
);

// Minimal icon-style button
const IconBtn: React.FC<{
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: active ? 'var(--color-surface-2)' : 'transparent',
      border: '1px solid',
      borderColor: active ? 'var(--color-border-light)' : 'transparent',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background 0.15s, border-color 0.15s',
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'var(--color-surface-2)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }
    }}
  >
    {children}
  </button>
);

// Text action button (Import, Export, Add)
const ActionBtn: React.FC<{
  onClick: () => void;
  accent?: boolean;
  children: React.ReactNode;
}> = ({ onClick, accent, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '5px 12px',
      height: 32,
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
      borderRadius: '7px',
      border: '1px solid',
      borderColor: accent ? 'var(--color-accent)' : 'var(--color-border)',
      background: 'transparent',
      color: accent ? 'var(--color-accent)' : 'var(--color-text-secondary)',
      fontSize: '0.78rem',
      fontWeight: 700,
      fontFamily: 'var(--font-body)',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'background 0.15s, color 0.15s, border-color 0.15s',
      letterSpacing: '0.01em',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = accent
        ? 'rgba(255,128,0,0.08)'
        : 'var(--color-surface-2)';
      if (!accent)
        e.currentTarget.style.borderColor = 'var(--color-border-light)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent';
      e.currentTarget.style.borderColor = accent
        ? 'var(--color-accent)'
        : 'var(--color-border)';
    }}
  >
    {children}
  </button>
);

// ── MyList ────────────────────────────────────────────────────────────────────

const VIEW_MODE_KEY = 'cuemovie-view-mode';

const MyList: React.FC<Props> = ({
  movies,
  isEnriching,
  progress,
  enrichmentTime,
  error,
  onAddMovie,
  onRemoveMovie,
  onMoviesLoaded,
  onExport,
  onClearError,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) ?? 'grid',
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);

  const prevEnriching = useRef(isEnriching);

  // Close the import panel when enrichment finishes
  useEffect(() => {
    if (prevEnriching.current && !isEnriching) {
      setImportOpen(false);
    }
    prevEnriching.current = isEnriching;
  }, [isEnriching]);

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  const openSearch = () => {
    setSearchOpen(true);
    setImportOpen(false);
    onClearError();
  };

  const openImport = () => {
    setImportOpen(true);
    setSearchOpen(false);
    setImportMode(movies.length > 0 ? 'merge' : 'replace');
    onClearError();
  };

  const handleCSVLoaded = (rawMovies: Movie[]) => {
    // If the list was empty when import was opened, always replace
    onMoviesLoaded(rawMovies, importMode);
  };

  const isEmpty = movies.length === 0 && !isEnriching;

  return (
    <>
      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {isEmpty && !searchOpen && !importOpen && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '14px',
            padding: '48px 0',
          }}
        >
          <span style={{ fontSize: '2.8rem', opacity: 0.35 }}>🎬</span>
          <div>
            <p
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--color-text)',
              }}
            >
              Your watchlist is empty
            </p>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
                marginTop: '4px',
              }}
            >
              Import a CSV from IMDb or Letterboxd, or search for movies to add
              one by one.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <ActionBtn onClick={openImport}>↑ Import CSV</ActionBtn>
            <ActionBtn onClick={openSearch} accent>
              + Search movies
            </ActionBtn>
          </div>
        </div>
      )}

      {/* ── Search panel ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <MovieSearch
              movies={movies}
              onAdd={(movie: Movie) => {
                onAddMovie(movie);
              }}
              onClose={() => setSearchOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Import panel ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {(importOpen || isEnriching) && !searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {/* Merge / Replace toggle — only shown when list is not empty and not yet enriching */}
            {movies.length > 0 && !isEnriching && (
              <div
                style={{
                  display: 'flex',
                  gap: '0',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--color-border)',
                  alignItems: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    marginRight: '12px',
                  }}
                >
                  Import mode
                </p>
                {(['merge', 'replace'] as ImportMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setImportMode(mode)}
                    style={{
                      padding: '4px 12px',
                      borderRadius:
                        mode === 'merge' ? '6px 0 0 6px' : '0 6px 6px 0',
                      border: '1px solid',
                      borderColor:
                        importMode === mode
                          ? 'var(--color-accent)'
                          : 'var(--color-border)',
                      background:
                        importMode === mode
                          ? 'rgba(255,128,0,0.1)'
                          : 'transparent',
                      color:
                        importMode === mode
                          ? 'var(--color-accent)'
                          : 'var(--color-text-secondary)',
                      fontSize: '0.775rem',
                      fontWeight: 700,
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      // Remove double border between buttons
                      marginLeft: mode === 'replace' ? '-1px' : 0,
                    }}
                  >
                    {mode === 'merge' ? 'Add to list' : 'Replace list'}
                  </button>
                ))}
                <button
                  onClick={() => setImportOpen(false)}
                  style={{
                    marginLeft: 'auto',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-muted)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    padding: '2px 4px',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = 'var(--color-text)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = 'var(--color-muted)')
                  }
                >
                  ✕
                </button>
              </div>
            )}
            <div style={{ padding: '4px' }}>
              <CSVUpload
                movieCount={0}
                isEnriching={isEnriching}
                progress={progress}
                enrichmentTime={enrichmentTime}
                onMoviesLoaded={handleCSVLoaded}
                onExport={onExport}
                onError={() => {}}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'rgba(229,83,83,0.08)',
            border: '1px solid rgba(229,83,83,0.3)',
            borderRadius: '8px',
          }}
        >
          <p
            style={{
              fontSize: '0.825rem',
              color: 'var(--color-danger)',
              fontWeight: 600,
            }}
          >
            {error}
          </p>
          <button
            onClick={onClearError}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-danger)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-body)',
              opacity: 0.7,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Loaded state ─────────────────────────────────────────────────── */}
      {movies.length > 0 && (
        <>
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {/* Count */}
            <span
              style={{
                fontSize: '0.825rem',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
                marginRight: 'auto',
              }}
            >
              {movies.length}{' '}
              <span style={{ fontWeight: 500 }}>
                {movies.length === 1 ? 'film' : 'films'}
              </span>
            </span>

            {/* View toggle */}
            <IconBtn
              onClick={() => setViewMode('grid')}
              active={viewMode === 'grid'}
              title="Grid view"
            >
              <GridIcon active={viewMode === 'grid'} />
            </IconBtn>
            <IconBtn
              onClick={() => setViewMode('list')}
              active={viewMode === 'list'}
              title="List view"
            >
              <ListIcon active={viewMode === 'list'} />
            </IconBtn>

            <div
              style={{
                width: '1px',
                height: '20px',
                background: 'var(--color-border)',
                margin: '0 2px',
              }}
            />

            {/* Actions */}
            <ActionBtn onClick={openSearch} accent>
              + Add
            </ActionBtn>
            <ActionBtn onClick={openImport}>↑ Import</ActionBtn>
            <ActionBtn onClick={onExport}>↓ Export</ActionBtn>
          </div>

          {/* Watchlist view */}
          {viewMode === 'grid' ? (
            <WatchlistGrid
              movies={movies}
              onRemove={onRemoveMovie}
              onMovieClick={setModalMovie}
            />
          ) : (
            <WatchlistListView
              movies={movies}
              onRemove={onRemoveMovie}
              onMovieClick={setModalMovie}
            />
          )}
        </>
      )}

      {/* ── Movie detail modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {modalMovie && (
          <MovieModal movie={modalMovie} onClose={() => setModalMovie(null)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default MyList;
