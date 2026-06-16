import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';

import type { Movie } from '../types';
import MovieModal from './MovieModal';
import TonightsPick from './TonightsPick';

type Props = {
  movies: Movie[];
  onMoviePicked?: (movie: Movie) => void;
  onRemoveMovie?: (movie: Movie) => void;
  deckEnabled?: boolean;
  shuffleActive?: boolean;
  lastPick: Movie | null;
  deckFull?: boolean;
};

const MoviePicker: React.FC<Props> = ({
  movies,
  onMoviePicked,
  onRemoveMovie,
  deckEnabled,
  shuffleActive,
  lastPick,
  deckFull,
}) => {
  const [showModal, setShowModal] = useState(false);

  const pickRandom = () => {
    if (movies.length === 0) return;
    const movie = movies[Math.floor(Math.random() * movies.length)];
    if (!deckEnabled) setShowModal(true);
    onMoviePicked?.(movie);
  };

  const isEmpty = movies.length === 0;
  const label = deckEnabled
    ? deckFull
      ? 'Deck is Full'
      : 'Add to Deck'
    : lastPick
      ? 'Pick Again'
      : 'Pick a Movie';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
      }}
    >
      {isEmpty ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p
            style={{
              fontSize: '0.95rem',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            No movies match your filters
          </p>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--color-muted)',
              marginTop: '4px',
              fontWeight: 500,
            }}
          >
            Try adjusting or resetting the filters above
          </p>
        </div>
      ) : (
        !shuffleActive && (
          <motion.button
            onClick={pickRandom}
            disabled={deckEnabled && deckFull}
            whileHover={!deckFull ? { scale: 1.04 } : {}}
            whileTap={!deckFull ? { scale: 0.96 } : {}}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            style={{
              padding: deckEnabled ? '13px 32px' : '17px 56px',
              borderRadius: '50px',
              border: 'none',
              background: deckEnabled
                ? deckFull
                  ? 'var(--color-surface-2)'
                  : 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)'
                : 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)',
              color: deckEnabled && deckFull ? 'var(--color-muted)' : 'white',
              fontSize: deckEnabled ? '0.9rem' : '1.1rem',
              fontWeight: 700,
              fontFamily: 'var(--font-body)',
              cursor: deckEnabled && deckFull ? 'default' : 'pointer',
              letterSpacing: '-0.01em',
              boxShadow: deckEnabled
                ? deckFull
                  ? 'none'
                  : '0 0 24px rgba(255,128,0,0.25), 0 4px 16px rgba(255,128,0,0.15)'
                : '0 0 40px rgba(255,128,0,0.3), 0 8px 24px rgba(255,128,0,0.2)',
            }}
          >
            {label}
          </motion.button>
        )
      )}

      {/* Tonight's Pick - normal mode only */}
      {!deckEnabled && (
        <AnimatePresence>
          {lastPick && (
            <TonightsPick
              key={lastPick.title}
              movie={lastPick}
              onCardClick={() => setShowModal(true)}
              onRemove={onRemoveMovie}
            />
          )}
        </AnimatePresence>
      )}

      {/* Modal - only ever shown in normal mode */}
      <AnimatePresence>
        {!deckEnabled && showModal && lastPick && (
          <MovieModal movie={lastPick} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoviePicker;
