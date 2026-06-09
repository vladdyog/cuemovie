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

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const DEFAULT_PAGE_SIZE = 20;
const VIEW_MODE_KEY = 'cuemovie-view-mode';

function movieKey(m: Movie): string {
  return `${m.title}::${m.year ?? ''}`;
}

// ── Icon buttons ──────────────────────────────────────────────────────────────

const GridIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
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

const ActionBtn: React.FC<{
  onClick: () => void;
  accent?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ onClick, accent, danger, children }) => {
  const borderColor = danger
    ? 'var(--color-danger)'
    : accent
      ? 'var(--color-accent)'
      : 'var(--color-border)';
  const color = danger
    ? 'var(--color-danger)'
    : accent
      ? 'var(--color-accent)'
      : 'var(--color-text-secondary)';
  const hoverBg = danger
    ? 'rgba(229,83,83,0.1)'
    : accent
      ? 'rgba(255,128,0,0.08)'
      : 'var(--color-surface-2)';
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px',
        height: 32,
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        borderRadius: '7px',
        border: `1px solid ${borderColor}`,
        background: 'transparent',
        color,
        fontSize: '0.78rem',
        fontWeight: 700,
        fontFamily: 'var(--font-body)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
        letterSpacing: '0.01em',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
};

// ── Pagination ────────────────────────────────────────────────────────────────

const Pagination: React.FC<{
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
}> = ({ page, totalPages, pageSize, onPageChange, onPageSizeChange }) => {
  if (totalPages <= 1 && pageSize === PAGE_SIZE_OPTIONS[0]) return null;

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  const btnBase: React.CSSProperties = {
    minWidth: 32,
    height: 32,
    padding: '0 6px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    fontSize: '0.8rem',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      {/* Page numbers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={{
            ...btnBase,
            opacity: page === 1 ? 0.35 : 1,
            cursor: page === 1 ? 'default' : 'pointer',
          }}
        >
          ←
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span
              key={`ellipsis-${i}`}
              style={{
                ...btnBase,
                border: 'none',
                cursor: 'default',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              style={{
                ...btnBase,
                borderColor:
                  p === page ? 'var(--color-accent)' : 'var(--color-border)',
                color:
                  p === page
                    ? 'var(--color-accent)'
                    : 'var(--color-text-secondary)',
                background: p === page ? 'rgba(255,128,0,0.08)' : 'transparent',
                fontWeight: p === page ? 700 : 600,
              }}
            >
              {p}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          style={{
            ...btnBase,
            opacity: page === totalPages ? 0.35 : 1,
            cursor: page === totalPages ? 'default' : 'pointer',
          }}
        >
          →
        </button>
      </div>

      {/* Per-page selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontSize: '0.775rem',
            color: 'var(--color-muted)',
            fontWeight: 500,
          }}
        >
          Per page
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {PAGE_SIZE_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => onPageSizeChange(n)}
              style={{
                ...btnBase,
                minWidth: 36,
                borderColor:
                  n === pageSize
                    ? 'var(--color-accent)'
                    : 'var(--color-border)',
                color:
                  n === pageSize
                    ? 'var(--color-accent)'
                    : 'var(--color-text-secondary)',
                background:
                  n === pageSize ? 'rgba(255,128,0,0.08)' : 'transparent',
                fontWeight: n === pageSize ? 700 : 600,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── MyList ────────────────────────────────────────────────────────────────────

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
  const [confirmRemove, setConfirmRemove] = useState<Movie | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Selection
  const [selectMode, setSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [confirmBulkRemove, setConfirmBulkRemove] = useState(false);

  const prevEnriching = useRef(isEnriching);

  useEffect(() => {
    if (prevEnriching.current && !isEnriching) setImportOpen(false);
    prevEnriching.current = isEnriching;
  }, [isEnriching]);

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  // Reset to page 1 when movies list or page size changes
  useEffect(() => {
    setPage(1);
  }, [movies.length, pageSize]);

  // Clear selection when leaving select mode
  useEffect(() => {
    if (!selectMode) setSelectedKeys(new Set());
  }, [selectMode]);

  const totalPages = Math.max(1, Math.ceil(movies.length / pageSize));
  const pagedMovies = movies.slice((page - 1) * pageSize, page * pageSize);

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
    onMoviesLoaded(rawMovies, importMode);
  };

  const handleToggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleBulkRemoveConfirm = () => {
    movies
      .filter((m) => selectedKeys.has(movieKey(m)))
      .forEach((m) => onRemoveMovie(m));
    setSelectedKeys(new Set());
    setSelectMode(false);
    setConfirmBulkRemove(false);
  };

  const isEmpty = movies.length === 0 && !isEnriching;
  const selectedCount = selectedKeys.size;

  return (
    <>
      {/* ── Empty state ── */}
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

      {/* ── Search panel ── */}
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
              onAdd={onAddMovie}
              onClose={() => setSearchOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Import panel ── */}
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
            {movies.length > 0 && !isEnriching && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--color-border)',
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
                {/* Segmented control */}
                <div
                  style={{
                    display: 'flex',
                    borderRadius: '7px',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                  }}
                >
                  {(['merge', 'replace'] as ImportMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setImportMode(mode)}
                      style={{
                        padding: '4px 14px',
                        border: 'none',
                        borderRight:
                          mode === 'merge'
                            ? '1px solid var(--color-border)'
                            : 'none',
                        background:
                          importMode === mode
                            ? 'rgba(255,128,0,0.12)'
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
                      }}
                    >
                      {mode === 'merge' ? 'Add to list' : 'Replace list'}
                    </button>
                  ))}
                </div>
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

      {/* ── Error banner ── */}
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

      {/* ── Loaded state ── */}
      {movies.length > 0 && (
        <>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {selectMode ? (
              <>
                <span
                  style={{
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    color: 'var(--color-text-secondary)',
                    marginRight: 'auto',
                  }}
                >
                  {selectedCount} selected
                </span>
                {selectedCount > 0 && (
                  <ActionBtn onClick={() => setConfirmBulkRemove(true)} danger>
                    Remove ({selectedCount})
                  </ActionBtn>
                )}
                <ActionBtn onClick={() => setSelectMode(false)}>
                  Cancel
                </ActionBtn>
              </>
            ) : (
              <>
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
                <ActionBtn onClick={openSearch} accent>
                  + Add
                </ActionBtn>
                <ActionBtn onClick={() => setSelectMode(true)}>
                  Select
                </ActionBtn>
                <ActionBtn onClick={openImport}>↑ Import</ActionBtn>
                <ActionBtn onClick={onExport}>↓ Export</ActionBtn>
              </>
            )}
          </div>

          {/* Watchlist view */}
          {viewMode === 'grid' ? (
            <WatchlistGrid
              movies={pagedMovies}
              selectedKeys={selectedKeys}
              selectMode={selectMode}
              onRemove={(m) => setConfirmRemove(m)}
              onMovieClick={setModalMovie}
              onToggleSelect={handleToggleSelect}
            />
          ) : (
            <WatchlistListView
              movies={pagedMovies}
              selectedKeys={selectedKeys}
              selectMode={selectMode}
              onRemove={(m) => setConfirmRemove(m)}
              onMovieClick={setModalMovie}
              onToggleSelect={handleToggleSelect}
            />
          )}

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
        </>
      )}

      {/* ── Confirm single remove ── */}
      <AnimatePresence>
        {confirmRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: '24px',
            }}
            onClick={() => setConfirmRemove(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '24px',
                maxWidth: '360px',
                width: '100%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                }}
              >
                Remove from list
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 500,
                  marginTop: '8px',
                  lineHeight: 1.5,
                }}
              >
                Remove{' '}
                <strong style={{ color: 'var(--color-text)' }}>
                  {confirmRemove.title}
                </strong>{' '}
                from your watchlist?
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '20px',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={() => setConfirmRemove(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onRemoveMovie(confirmRemove);
                    setConfirmRemove(null);
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--color-danger)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm bulk remove ── */}
      <AnimatePresence>
        {confirmBulkRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: '24px',
            }}
            onClick={() => setConfirmBulkRemove(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                padding: '24px',
                maxWidth: '360px',
                width: '100%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                }}
              >
                Remove movies
              </p>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 500,
                  marginTop: '8px',
                  lineHeight: 1.5,
                }}
              >
                Remove{' '}
                <strong style={{ color: 'var(--color-text)' }}>
                  {selectedCount} {selectedCount === 1 ? 'movie' : 'movies'}
                </strong>{' '}
                from your watchlist?
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '20px',
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  onClick={() => setConfirmBulkRemove(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkRemoveConfirm}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--color-danger)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer',
                  }}
                >
                  Remove {selectedCount}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Movie detail modal ── */}
      <AnimatePresence>
        {modalMovie && (
          <MovieModal movie={modalMovie} onClose={() => setModalMovie(null)} />
        )}
      </AnimatePresence>
    </>
  );
};

export default MyList;
