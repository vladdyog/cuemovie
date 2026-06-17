import { Analytics } from '@vercel/analytics/react';
import { AnimatePresence } from 'framer-motion';
import React, { useEffect, useState } from 'react';

import FeedbackButton from './components/FeedbackButton';
import MovieDeck from './components/MovieDeck';
import MovieFilters from './components/MovieFilters';
import MoviePicker from './components/MoviePicker';
import MyList from './components/MyList';
import SupportButton from './components/SupportButton';
import TMDBAttribution from './components/TMDBAttribution';
import TonightsPick from './components/TonightsPick';
import Button from './components/ui/Button';
import MovieModal from './components/ui/MovieModal';
import SectionLabel from './components/ui/SectionLabel';
import type { FilterOptions, Movie } from './types';
import { exportWatchlistCSV, filterMovies } from './utils';
import { enrichAllMovies } from './utils/tmdb';

const STORAGE_KEY = 'watchlist';
const DECK_KEY = 'deck';
const TAB_KEY = 'cuemovie-active-tab';
const DECK_ENABLED_KEY = 'deckEnabled';
const MAX_DECK_SIZE = 10;
const APP_VERSION = import.meta.env.PACKAGE_VERSION;

function loadFromStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function saveToStorage(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const App: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>(
    () => loadFromStorage<Movie[]>(STORAGE_KEY) ?? [],
  );
  const [deck, setDeck] = useState<Movie[]>(
    () => loadFromStorage<Movie[]>(DECK_KEY) ?? [],
  );
  const [deckEnabled, setDeckEnabled] = useState<boolean>(
    () => loadFromStorage<boolean>(DECK_ENABLED_KEY) ?? false,
  );
  const [filters, setFilters] = useState<FilterOptions>({});
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [enrichmentTime, setEnrichmentTime] = useState<number | null>(null);
  const [lastPick, setLastPick] = useState<Movie | null>(null);
  const [shuffleActive, setShuffleActive] = useState(false);
  const [showDeckWinnerModal, setShowDeckWinnerModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'pick'>(
    () => loadFromStorage<'list' | 'pick'>(TAB_KEY) ?? 'pick',
  );

  useEffect(() => {
    if (progress === null) saveToStorage(STORAGE_KEY, movies);
  }, [movies, progress]);
  useEffect(() => {
    saveToStorage(DECK_KEY, deck);
  }, [deck]);
  useEffect(() => {
    saveToStorage(DECK_ENABLED_KEY, deckEnabled);
  }, [deckEnabled]);
  useEffect(() => {
    saveToStorage(TAB_KEY, activeTab);
  }, [activeTab]);

  const handleMoviesLoaded = async (
    rawMovies: Movie[],
    mode: 'merge' | 'replace' = 'replace',
  ) => {
    let moviesToEnrich = rawMovies;

    if (mode === 'merge') {
      const key = (m: Movie) => `${m.title.toLowerCase()}::${m.year ?? ''}`;
      const existingKeys = new Set(movies.map(key));
      moviesToEnrich = rawMovies.filter((m) => !existingKeys.has(key(m)));
      if (moviesToEnrich.length === 0) {
        setError('All movies in this CSV are already in your list!');
        return;
      }
    }

    setProgress({ completed: 0, total: moviesToEnrich.length });
    setEnrichmentTime(null);
    setError(null);
    if (mode === 'replace') setFilters({});

    const start = performance.now();
    const enriched = await enrichAllMovies(moviesToEnrich, (completed, total) =>
      setProgress({ completed, total }),
    );

    if (mode === 'replace') {
      setMovies(enriched);
    } else {
      setMovies((prev) => [...prev, ...enriched]);
    }

    setProgress(null);
    setEnrichmentTime((performance.now() - start) / 1000);
  };

  const handleMoviePicked = (movie: Movie) => {
    if (!deckEnabled) {
      setLastPick(movie);
      return;
    }
    setDeck((prev) =>
      prev.some((m) => m.title === movie.title) ? prev : [...prev, movie],
    );
  };

  const handleWatchThis = (winner: Movie) => {
    setLastPick(winner);
    setDeck([]);
  };

  const handleAddMovie = (movie: Movie) => {
    setMovies((prev) => {
      const exists = prev.some(
        (m) =>
          m.title.toLowerCase() === movie.title.toLowerCase() &&
          m.year === movie.year,
      );
      return exists ? prev : [...prev, movie];
    });
  };

  const handleRemoveMovie = (movie: Movie) => {
    setMovies((prev) => prev.filter((m) => m.title !== movie.title));
    setLastPick((prev) => (prev?.title === movie.title ? null : prev));
  };

  const isEnriching = progress !== null;
  const filteredMovies = filterMovies(movies, filters);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg)' }}
    >
      <Analytics />

      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        <div
          style={{ maxWidth: 672, margin: '0 auto', padding: '24px 24px 0' }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-display)',
              fontWeight:
                'var(--weight-display)' as React.CSSProperties['fontWeight'],
              color: 'var(--color-text)',
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
            }}
          >
            Cue<span style={{ color: 'var(--color-accent)' }}>Movie</span>
          </h1>
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
              marginTop: '6px',
              fontWeight:
                'var(--weight-medium)' as React.CSSProperties['fontWeight'],
            }}
          >
            From your watchlist to tonight's pick
          </p>
          <nav style={{ display: 'flex', marginTop: '16px' }}>
            <TabButton
              active={activeTab === 'pick'}
              onClick={() => setActiveTab('pick')}
            >
              Pick a Movie
            </TabButton>
            <TabButton
              active={activeTab === 'list'}
              onClick={() => setActiveTab('list')}
            >
              My List
              {movies.length > 0 && (
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight:
                      'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                    color:
                      activeTab === 'list'
                        ? 'var(--color-accent)'
                        : 'var(--color-muted)',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '1px 7px',
                    transition: 'color 0.15s',
                  }}
                >
                  {movies.length}
                </span>
              )}
            </TabButton>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1,
          maxWidth: 672,
          width: '100%',
          margin: '0 auto',
          padding: '40px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '44px',
        }}
      >
        {/* My List tab */}
        {activeTab === 'list' && (
          <MyList
            movies={movies}
            isEnriching={isEnriching}
            progress={progress}
            enrichmentTime={enrichmentTime}
            error={error}
            onAddMovie={handleAddMovie}
            onRemoveMovie={handleRemoveMovie}
            onMoviesLoaded={handleMoviesLoaded}
            onExport={() => exportWatchlistCSV(movies)}
            onClearError={() => setError(null)}
          />
        )}

        {/* Pick tab */}
        {activeTab === 'pick' && (
          <>
            {movies.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '14px',
                  padding: '60px 0',
                }}
              >
                <span
                  style={{ fontSize: 'var(--text-display)', opacity: 0.35 }}
                >
                  🎬
                </span>

                <div>
                  <p
                    style={{
                      fontSize: 'var(--text-md)',
                      fontWeight:
                        'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                      color: 'var(--color-text)',
                    }}
                  >
                    Nothing to pick from yet...
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
                    Go to 'My List' to import a CSV or search for movies to add.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setActiveTab('list')}
                  style={{ marginTop: '4px' }}
                >
                  Go to My List
                </Button>
              </div>
            ) : (
              <>
                {/* Filters */}
                <section>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '18px',
                    }}
                  >
                    <SectionLabel noMargin>Filters</SectionLabel>
                    <span
                      style={{
                        fontSize: 'var(--text-base)',
                        color: 'var(--color-text-secondary)',
                        fontWeight:
                          'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--color-text)',
                          fontWeight:
                            'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                        }}
                      >
                        {filteredMovies.length}
                      </span>
                      {' / '}
                      <span>
                        {movies.length}{' '}
                        {movies.length === 1 ? 'Movie' : 'Movies'}
                      </span>
                    </span>
                  </div>

                  <MovieFilters
                    movies={movies}
                    filters={filters}
                    onChange={setFilters}
                  />
                </section>

                {/* Picker */}
                <section>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '28px',
                    }}
                  >
                    <SectionLabel noMargin>Pick a Movie</SectionLabel>

                    <DeckToggle
                      enabled={deckEnabled}
                      onToggle={() => setDeckEnabled((v) => !v)}
                    />
                  </div>

                  <MoviePicker
                    movies={filteredMovies}
                    onMoviePicked={handleMoviePicked}
                    onRemoveMovie={handleRemoveMovie}
                    deckEnabled={deckEnabled}
                    shuffleActive={shuffleActive}
                    lastPick={lastPick}
                    deckFull={deck.length >= MAX_DECK_SIZE}
                  />

                  {deckEnabled && (
                    <div style={{ marginTop: '12px' }}>
                      <MovieDeck
                        movies={deck}
                        shuffleActive={shuffleActive}
                        onShuffleStart={() => setShuffleActive(true)}
                        onWatchThis={handleWatchThis}
                        onClose={() => setShuffleActive(false)}
                        onRemove={(m) =>
                          setDeck((prev) =>
                            prev.filter((w) => w.title !== m.title),
                          )
                        }
                        onClear={() => setDeck([])}
                      />
                    </div>
                  )}

                  {deckEnabled && lastPick && !shuffleActive && (
                    <div
                      style={{
                        marginTop: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <AnimatePresence>
                        <TonightsPick
                          key={lastPick.title}
                          movie={lastPick}
                          onCardClick={() => setShowDeckWinnerModal(true)}
                          onRemove={handleRemoveMovie}
                        />
                      </AnimatePresence>
                    </div>
                  )}

                  {showDeckWinnerModal && lastPick && (
                    <MovieModal
                      movie={lastPick}
                      onClose={() => setShowDeckWinnerModal(false)}
                    />
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '0 24px 16px',
        }}
      >
        <FeedbackButton />
      </div>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          rowGap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-muted)',
              fontWeight:
                'var(--weight-medium)' as React.CSSProperties['fontWeight'],
            }}
          >
            © 2026 CueMovie · v{APP_VERSION}
          </p>
          <div
            style={{
              width: '1px',
              height: '14px',
              background: 'var(--color-border)',
            }}
          />
          <TMDBAttribution />
        </div>

        <SupportButton />
      </footer>
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '7px',
      padding: '10px 4px',
      marginRight: '20px',
      background: 'transparent',
      border: 'none',
      borderBottom: active
        ? '2px solid var(--color-accent)'
        : '2px solid transparent',
      color: active ? 'var(--color-text)' : 'var(--color-muted)',
      fontSize: 'var(--text-base)',
      fontWeight: active
        ? ('var(--weight-bold)' as React.CSSProperties['fontWeight'])
        : ('var(--weight-medium)' as React.CSSProperties['fontWeight']),
      fontFamily: 'var(--font-body)',
      cursor: 'pointer',
      transition: 'color 0.15s',
      marginBottom: '-1px',
    }}
    onMouseEnter={(e) => {
      if (!active) e.currentTarget.style.color = 'var(--color-text-secondary)';
    }}
    onMouseLeave={(e) => {
      if (!active) e.currentTarget.style.color = 'var(--color-muted)';
    }}
  >
    {children}
  </button>
);

/* Deck mode toggle knob and label */
const DeckToggle: React.FC<{ enabled: boolean; onToggle: () => void }> = ({
  enabled,
  onToggle,
}) => (
  <button
    onClick={onToggle}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '9px',
      padding: '4px 0',
      border: 'none',
      background: 'transparent',
      color: enabled ? 'var(--color-accent)' : 'var(--color-muted)',
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
      fontFamily: 'var(--font-body)',
      cursor: 'pointer',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      transition: 'color 0.18s ease',
      userSelect: 'none',
    }}
  >
    {/* Knob track */}
    <span
      style={{
        display: 'inline-block',
        width: 30,
        height: 17,
        borderRadius: 9,
        background: enabled ? 'var(--color-accent)' : 'var(--color-border)',
        position: 'relative',
        transition: 'background 0.18s ease',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2.5,
          left: enabled ? 15 : 2.5,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: 'white',
          transition: 'left 0.18s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </span>
    Deck mode
  </button>
);

export default App;
