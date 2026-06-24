import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

import type { Movie } from '../types';
import CSVUpload from './CSVUpload';
import MovieSearch from './MovieSearch';
import Button from './ui/Button';
import MovieModal from './ui/MovieModal';
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
  const title = 'You sure about that?';
  const body =
    props.kind === 'single' || (props.kind === 'bulk' && props.count === 1) ? (
      <>
        Remove{' '}
        <strong style={{ color: 'var(--color-text)' }}>
          '{props.kind === 'single' ? props.movie.title : props.singleTitle}'
        </strong>{' '}
        from your list?
      </>
    ) : (
      <>
        Remove{' '}
        <strong style={{ color: 'var(--color-text)' }}>
          {props.count} movies
        </strong>{' '}
        from your list?
      </>
    );

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
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          maxWidth: '360px',
          width: '100%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          style={{
            fontSize: 'var(--text-md)',
            fontWeight:
              'var(--weight-bold)' as React.CSSProperties['fontWeight'],
            color: 'var(--color-text)',
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            fontWeight:
              'var(--weight-medium)' as React.CSSProperties['fontWeight'],
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
          <Button variant="surface" size="sm" onClick={props.onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={props.onConfirm}>
            Remove
          </Button>
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

  const changePage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onPageChange(p);
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <Button
        variant="surface"
        size="sm"
        onClick={() => changePage(page - 1)}
        disabled={page === 1}
      >
        Previous
      </Button>

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
              fontSize: 'var(--text-sm)',
              color: 'var(--color-muted)',
            }}
          >
            …
          </span>
        ) : (
          <Button
            key={slot}
            variant="surface"
            size="sm"
            active={slot === page}
            onClick={() => changePage(slot as number)}
            style={
              slot === page
                ? {
                    borderColor: 'var(--color-accent)',
                    color: 'var(--color-accent)',
                    background: 'var(--color-accent-subtle)',
                  }
                : {}
            }
          >
            {slot}
          </Button>
        ),
      )}

      <Button
        variant="surface"
        size="sm"
        onClick={() => changePage(page + 1)}
        disabled={page === totalPages}
      >
        Next
      </Button>
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
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            {!isEnriching && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <>
                  <p
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight:
                        'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                      color: 'var(--color-text-secondary)',
                      marginRight: '12px',
                    }}
                  >
                    Import mode
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      overflow: 'hidden',
                    }}
                  >
                    {(['merge', 'replace'] as ImportMode[]).map((mode) => {
                      const isMerge = mode === 'merge';
                      const isActive = importMode === mode;
                      const activeColor = isMerge
                        ? 'var(--color-blue)'
                        : 'var(--color-danger)';
                      const activeBg = isMerge
                        ? 'var(--color-blue-subtle)'
                        : 'var(--color-danger-subtle)';
                      return (
                        <button
                          key={mode}
                          onClick={() => setImportMode(mode)}
                          style={{
                            padding: '4px 14px',
                            border: 'none',
                            borderRight: isMerge
                              ? '1px solid var(--color-border)'
                              : 'none',
                            background: isActive ? activeBg : 'transparent',
                            color: isActive
                              ? activeColor
                              : 'var(--color-text-secondary)',
                            fontSize: 'var(--text-sm)',
                            fontWeight:
                              'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                            fontFamily: 'var(--font-body)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {isMerge ? 'Add to List' : 'Replace List'}
                        </button>
                      );
                    })}
                  </div>
                </>
                <button
                  onClick={() => setImportOpen(false)}
                  style={{
                    marginLeft: 'auto',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-muted)',
                    fontSize: 'var(--text-base)',
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
            background: 'var(--color-danger-subtle)',
            border: '1px solid rgba(229,83,83,0.3)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-danger)',
              fontWeight:
                'var(--weight-medium)' as React.CSSProperties['fontWeight'],
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
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-body)',
              opacity: 0.7,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Search bar - hidden in select mode and while import panel is open ── */}
      {!selectMode && !importOpen && !isEnriching && (
        <MovieSearch movies={movies} onAdd={onAddMovie} />
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
                fontSize: 'var(--text-md)',
                fontWeight:
                  'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                color: 'var(--color-text)',
              }}
            >
              Your watchlist is empty!
            </p>
            <p
              style={{
                fontSize: 'var(--text-base)',
                color: 'var(--color-text-secondary)',
                fontWeight:
                  'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                marginTop: '4px',
              }}
            >
              Import a CSV file, or use the search bar above to add some movies.
            </p>
          </div>
          <Button variant="secondary" size="md" onClick={openImport}>
            Import CSV
          </Button>
        </div>
      )}

      {/* ── Loaded state ── */}
      {movies.length > 0 && (
        <>
          {/* Toolbar: left side actions, right side display controls - wraps as a whole row when needed */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              rowGap: '8px',
            }}
          >
            {/* Left - count + actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0,
              }}
            >
              {selectMode ? (
                <>
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight:
                        'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                      color: 'var(--color-text-secondary)',
                      whiteSpace: 'nowrap',
                      minWidth: '90px',
                    }}
                  >
                    {selectedCount} selected
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (selectedCount > 0) setConfirmBulkRemove(true);
                    }}
                  >
                    Remove
                  </Button>
                  <Button
                    variant="surface"
                    size="sm"
                    onClick={() => setSelectMode(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight:
                        'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                      color: 'var(--color-text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {movies.length}{' '}
                    <span
                      style={{
                        fontWeight:
                          'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                      }}
                    >
                      {movies.length === 1 ? 'Movie' : 'Movies'}
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
                  <Button
                    variant="surface"
                    size="sm"
                    onClick={() => setSelectMode(true)}
                  >
                    Select
                  </Button>
                  <Button variant="surface" size="sm" onClick={openImport}>
                    ↑ Import
                  </Button>
                  <Button variant="surface" size="sm" onClick={onExport}>
                    ↓ Export
                  </Button>
                </>
              )}
            </div>

            {/* Right - display controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                justifyContent: 'flex-end',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight:
                    'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                  color: 'var(--color-muted)',
                  whiteSpace: 'nowrap',
                  marginRight: '2px',
                }}
              >
                Per page
              </span>
              {PAGE_SIZE_OPTIONS.map((n) => {
                const isActive = n === pageSize;
                return (
                  <Button
                    key={n}
                    variant="toggle"
                    size="sm"
                    active={isActive}
                    onClick={() => {
                      setPageSize(n);
                      setPage(1);
                    }}
                    style={{ padding: '7px 8px' }}
                  >
                    {n}
                  </Button>
                );
              })}
              <div
                style={{
                  width: '1px',
                  height: '20px',
                  background: 'var(--color-border)',
                  margin: '0 4px',
                }}
              />
              <Button
                variant="toggle"
                size="icon"
                active={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <GridIcon active={viewMode === 'grid'} />
              </Button>
              <Button
                variant="toggle"
                size="icon"
                active={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <ListIcon active={viewMode === 'list'} />
              </Button>
            </div>
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
            onPageChange={setPage}
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
