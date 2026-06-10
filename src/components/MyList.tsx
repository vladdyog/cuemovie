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

// ── Remove modal (single source of truth for both single and bulk) ─────────

type RemoveModalProps =
  | {
      kind: 'single';
      movie: Movie;
      onConfirm: () => void;
      onCancel: () => void;
    }
  | {
      kind: 'bulk';
      count: number;
      singleTitle?: string;
      onConfirm: () => void;
      onCancel: () => void;
    };

const RemoveModal: React.FC<RemoveModalProps> = (props) => {
  const title = 'Remove from list';
  const body =
    props.kind === 'single' || (props.kind === 'bulk' && props.count === 1) ? (
      <>
        Remove{' '}
        <strong style={{ color: 'var(--color-text)' }}>
          {props.kind === 'single' ? props.movie.title : props.singleTitle}
        </strong>{' '}
        from your watchlist?
      </>
    ) : (
      <>
        Remove{' '}
        <strong style={{ color: 'var(--color-text)' }}>
          {props.count} movies
        </strong>{' '}
        from your watchlist?
      </>
    );
  const confirmLabel =
    props.kind === 'single' || (props.kind === 'bulk' && props.count === 1)
      ? 'Remove'
      : `Remove ${props.count}`;

  return (
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
      onClick={props.onCancel}
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
          {title}
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
          {body}
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
            onClick={props.onCancel}
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
            onClick={props.onConfirm}
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
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Shared button primitives ──────────────────────────────────────────────────

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
        transition: 'background 0.15s',
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

const PageSizeBtn: React.FC<{
  n: number;
  active: boolean;
  onClick: () => void;
}> = ({ n, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      minWidth: 36,
      height: 32,
      padding: '0 6px',
      borderRadius: '6px',
      border: '1px solid',
      borderColor: active ? 'var(--color-accent)' : 'var(--color-border)',
      background: active ? 'rgba(255,128,0,0.08)' : 'transparent',
      color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
      fontSize: '0.78rem',
      fontWeight: active ? 700 : 600,
      fontFamily: 'var(--font-body)',
      cursor: 'pointer',
      transition: 'all 0.15s',
    }}
  >
    {n}
  </button>
);

// ── Pagination ────────────────────────────────────────────────────────────────

function getPageSlots(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3)
    return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

const Pagination: React.FC<{
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const slots = getPageSlots(page, totalPages);

  const navStyle = (disabled: boolean): React.CSSProperties => ({
    padding: '0 12px',
    height: 32,
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    background: 'transparent',
    color: disabled ? 'var(--color-muted)' : 'var(--color-text-secondary)',
    fontSize: '0.78rem',
    fontWeight: 600,
    fontFamily: 'var(--font-body)',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'background 0.15s',
  });

  const slotStyle = (isActive: boolean): React.CSSProperties => ({
    minWidth: 32,
    height: 32,
    padding: '0 6px',
    borderRadius: '6px',
    border: '1px solid',
    borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
    background: isActive ? 'rgba(255,128,0,0.08)' : 'transparent',
    color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
    fontSize: '0.8rem',
    fontWeight: isActive ? 700 : 600,
    fontFamily: 'var(--font-body)',
    cursor: isActive ? 'default' : 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        style={navStyle(page === 1)}
        onMouseEnter={(e) => {
          if (page !== 1)
            e.currentTarget.style.background = 'var(--color-surface-2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        Previous
      </button>
      {slots.map((slot, i) =>
        slot === '…' ? (
          <span
            key={`e-${i}`}
            style={{
              minWidth: 32,
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              color: 'var(--color-muted)',
            }}
          >
            …
          </span>
        ) : (
          <button
            key={slot}
            onClick={() => slot !== page && onPageChange(slot as number)}
            style={slotStyle(slot === page)}
            onMouseEnter={(e) => {
              if (slot !== page)
                e.currentTarget.style.background = 'var(--color-surface-2)';
            }}
            onMouseLeave={(e) => {
              if (slot !== page)
                e.currentTarget.style.background = 'transparent';
            }}
          >
            {slot}
          </button>
        ),
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        style={navStyle(page === totalPages)}
        onMouseEnter={(e) => {
          if (page !== totalPages)
            e.currentTarget.style.background = 'var(--color-surface-2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        Next
      </button>
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
  const [importOpen, setImportOpen] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Movie | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

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
  useEffect(() => {
    setPage(1);
  }, [movies.length, pageSize]);
  useEffect(() => {
    if (!selectMode) setSelectedKeys(new Set());
  }, [selectMode]);

  const totalPages = Math.max(1, Math.ceil(movies.length / pageSize));
  const pagedMovies = movies.slice((page - 1) * pageSize, page * pageSize);

  const openImport = () => {
    setImportOpen(true);
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

  const selectedCount = selectedKeys.size;
  const singleSelectedTitle =
    selectedCount === 1
      ? movies.find((m) => selectedKeys.has(movieKey(m)))?.title
      : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Import panel ── */}
      <AnimatePresence>
        {(importOpen || isEnriching) && (
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

      {/* ── Empty state (no movies yet, not enriching) ── */}
      {movies.length === 0 && !isEnriching && !importOpen && (
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
              Import a CSV from IMDb or Letterboxd, or search above to add
              movies one by one.
            </p>
          </div>
          <ActionBtn onClick={openImport}>↑ Import CSV</ActionBtn>
        </div>
      )}

      {/* ── Loaded state ── */}
      {movies.length > 0 && (
        <>
          {/* Toolbar grid: 2 columns on row 1, search bar spans full width on row 2 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            {/* Row 1, Col 1 — count + actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              {selectMode ? (
                <>
                  <span
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      color: 'var(--color-text-secondary)',
                      whiteSpace: 'nowrap',
                      minWidth: '90px',
                    }}
                  >
                    {selectedCount} selected
                  </span>
                  <ActionBtn
                    onClick={() => {
                      if (selectedCount > 0) setConfirmBulkRemove(true);
                    }}
                    danger
                  >
                    Remove
                  </ActionBtn>
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
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {movies.length}{' '}
                    <span style={{ fontWeight: 500 }}>
                      {movies.length === 1 ? 'movie' : 'movies'}
                    </span>
                  </span>
                  <div
                    style={{
                      width: '1px',
                      height: '20px',
                      background: 'var(--color-border)',
                      flexShrink: 0,
                    }}
                  />
                  <ActionBtn onClick={() => setSelectMode(true)}>
                    Select
                  </ActionBtn>
                  <ActionBtn onClick={openImport}>↑ Import</ActionBtn>
                  <ActionBtn onClick={onExport}>↓ Export</ActionBtn>
                </>
              )}
            </div>

            {/* Row 1, Col 2 — display controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-muted)',
                  whiteSpace: 'nowrap',
                  marginRight: '2px',
                }}
              >
                Per page
              </span>
              {PAGE_SIZE_OPTIONS.map((n) => (
                <PageSizeBtn
                  key={n}
                  n={n}
                  active={n === pageSize}
                  onClick={() => {
                    setPageSize(n);
                    setPage(1);
                  }}
                />
              ))}
              <div
                style={{
                  width: '1px',
                  height: '20px',
                  background: 'var(--color-border)',
                  margin: '0 4px',
                }}
              />
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
            </div>

            {/* Row 2 — search bar spans both columns, hidden in select mode */}
            {!selectMode && (
              <div style={{ gridColumn: '1 / -1' }}>
                <MovieSearch movies={movies} onAdd={onAddMovie} />
              </div>
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
            onPageChange={(p) => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setPage(p);
            }}
          />
        </>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {confirmRemove && (
          <RemoveModal
            kind="single"
            movie={confirmRemove}
            onConfirm={() => {
              onRemoveMovie(confirmRemove);
              setConfirmRemove(null);
            }}
            onCancel={() => setConfirmRemove(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmBulkRemove && (
          <RemoveModal
            kind="bulk"
            count={selectedCount}
            singleTitle={singleSelectedTitle}
            onConfirm={handleBulkRemoveConfirm}
            onCancel={() => setConfirmBulkRemove(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalMovie && (
          <MovieModal movie={modalMovie} onClose={() => setModalMovie(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyList;
