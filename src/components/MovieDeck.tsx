import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

import type { Movie } from '../types';
import MovieCard from './MovieCard';
import MovieModal from './MovieModal';

type Props = {
  movies: Movie[];
  onRemove: (movie: Movie) => void;
  onClear: () => void;
  shuffleActive: boolean;
  onShuffleStart: () => void;
  onWatchThis: (movie: Movie) => void;
  onClose: () => void;
};

const CARD_WIDTH = 140;
const CARD_HEIGHT = 210;
const CARD_OFFSET = 48;
const SHUFFLE_DURATION = 3500;
const OVERLAY_SCALE = 1.55;
const HOVER_LIFT = 42;
const CONTAINER_TOP_BUFFER = 50;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

const PosterCard: React.FC<{
  movie: Movie;
  index: number;
  offset: number;
  isHovered: boolean;
  isActive: boolean;
  isWinner: boolean;
  isShuffling: boolean;
  isFlipped: boolean;
  nudge: number;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onClick: () => void;
  onRemove: () => void;
}> = ({
  movie,
  index,
  offset,
  isHovered,
  isActive,
  isWinner,
  isShuffling,
  isFlipped,
  nudge,
  onHoverStart,
  onHoverEnd,
  onClick,
  onRemove,
}) => {
  const isLifted = isHovered || isActive || isWinner;

  let borderColor = 'var(--color-border)';
  let glow = 'none';
  if (isWinner) {
    borderColor = 'var(--color-accent)';
    glow = '0 0 28px rgba(255,128,0,0.4), 0 6px 20px rgba(0,0,0,0.5)';
  } else if (isActive) {
    borderColor = 'rgba(255,128,0,0.45)';
    glow = '0 4px 16px rgba(0,0,0,0.4)';
  } else if (isHovered) {
    borderColor = 'var(--color-accent)';
    glow = '0 0 16px rgba(255,128,0,0.25), 0 6px 20px rgba(0,0,0,0.4)';
  }

  // Winner card: no info overlay - title/year are shown below the fan instead.
  // Non-winner hovered card: show info overlay as usual.
  const showInfo = isHovered && !isShuffling && !isWinner;

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        left: index * offset,
        bottom: 0,
        originX: '50%',
        originY: '100%',
        zIndex: isLifted ? 50 : index,
        perspective: 800,
      }}
      animate={{
        x: nudge,
        y: isLifted ? -HOVER_LIFT : 0,
        scale: isLifted ? 1.05 : 1,
      }}
      transition={{ type: 'spring', stiffness: 220, damping: 34 }}
      onHoverStart={() => !isShuffling && onHoverStart()}
      onHoverEnd={onHoverEnd}
      onClick={onClick}
    >
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          position: 'relative',
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: 'easeInOut' }}
      >
        {/* Front */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '10px',
            overflow: 'hidden',
            border: `2px solid ${borderColor}`,
            boxShadow: glow,
            transition: 'border-color 0.2s, box-shadow 0.2s',
            backfaceVisibility: 'hidden',
          }}
        >
          <AnimatePresence>
            {isHovered && !isShuffling && !isFlipped && !isWinner && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.12 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                style={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  zIndex: 50,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  fontSize: '0.65rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--color-danger)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(0,0,0,0.8)')
                }
              >
                ✕
              </motion.button>
            )}
          </AnimatePresence>

          {movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.title}
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
                background:
                  'linear-gradient(145deg, var(--color-surface-2) 0%, var(--color-border) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
              }}
            >
              <span style={{ opacity: 0.25 }}>🎬</span>
            </div>
          )}

          {/* Hover info overlay (non-winner cards only) */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '10px',
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)',
                }}
              >
                <p
                  style={{
                    color: 'white',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    WebkitLineClamp: 2,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {movie.title}
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '7px',
                    marginTop: '4px',
                    alignItems: 'center',
                  }}
                >
                  {movie.year && (
                    <span
                      style={{
                        color: 'rgba(255,255,255,0.55)',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                      }}
                    >
                      {movie.year}
                    </span>
                  )}
                  {movie.rating && (
                    <span
                      style={{
                        color: 'var(--color-green)',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      ★ {movie.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back - opaque */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '10px',
            border: '2px solid var(--color-border-light)',
            background: 'linear-gradient(145deg, #1C2228 0%, #252D35 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              opacity: 0.18,
            }}
          >
            <span style={{ fontSize: '2rem' }}>?</span>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                alignItems: 'center',
              }}
            >
              {[40, 28, 36].map((w, i) => (
                <div
                  key={i}
                  style={{
                    height: 2,
                    width: w,
                    borderRadius: 1,
                    background: 'var(--color-text)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MovieDeck: React.FC<Props> = ({
  movies,
  onRemove,
  onClear,
  shuffleActive,
  onShuffleStart,
  onWatchThis,
  onClose,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [winnerMovie, setWinnerMovie] = useState<Movie | null>(null);
  const [watchAccepted, setWatchAccepted] = useState(false);
  const [modalMovie, setModalMovie] = useState<Movie | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Escape key - works both in shuffle state and winner reveal state
  useEffect(() => {
    if (!shuffleActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shuffleActive, onClose]);

  useEffect(() => {
    if (
      !watchAccepted &&
      winnerMovie &&
      !movies.find((m) => m.title === winnerMovie.title)
    ) {
      setWinnerMovie(null);
      setActiveIndex(null);
      setFlippedCards(new Set());
    }
  }, [movies, winnerMovie, watchAccepted]);

  useEffect(() => {
    if (shuffleActive) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [shuffleActive]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setHoveredIndex(null);
  }, [movies.length]);

  const prevShuffleRef = useRef(false);
  useEffect(() => {
    if (prevShuffleRef.current && !shuffleActive) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setIsShuffling(false);
      setWinnerMovie(null);
      setWatchAccepted(false);
      setActiveIndex(null);
      setFlippedCards(new Set());
    }
    prevShuffleRef.current = shuffleActive;
  }, [shuffleActive]);

  const runSpin = (pool: Movie[]) => {
    if (pool.length < 2) return;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const picked = Math.floor(Math.random() * pool.length);
    const totalTicks = 5 * pool.length + picked;
    setWinnerMovie(null);
    setWatchAccepted(false);
    setHoveredIndex(null);
    setActiveIndex(0);
    setFlippedCards(new Set(pool.map((_, i) => i)));
    setIsShuffling(true);
    startTimeRef.current = null;

    setTimeout(() => {
      const animate = (ts: number) => {
        if (!startTimeRef.current) startTimeRef.current = ts;
        const elapsed = ts - startTimeRef.current;
        const progress = Math.min(elapsed / SHUFFLE_DURATION, 1);
        setActiveIndex(
          Math.floor(easeOut(progress) * totalTicks) % pool.length,
        );
        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        } else {
          setActiveIndex(picked);
          setFlippedCards((prev) => {
            const n = new Set(prev);
            n.delete(picked);
            return n;
          });
          setWinnerMovie(pool[picked]);
          setIsShuffling(false);
        }
      };
      animRef.current = requestAnimationFrame(animate);
    }, 600);
  };

  const handleShuffle = () => {
    onShuffleStart();
    runSpin(movies);
  };

  const handleWatchThis = () => {
    if (!winnerMovie) return;
    setWatchAccepted(true);
    onWatchThis(winnerMovie);
  };

  const handleEliminate = () => {
    if (!winnerMovie) return;
    onRemove(winnerMovie);
    const remaining = movies.filter((m) => m.title !== winnerMovie.title);
    setWinnerMovie(null);
    setActiveIndex(null);
    if (remaining.length === 1) {
      setWinnerMovie(remaining[0]);
      setWatchAccepted(true);
      onWatchThis(remaining[0]);
    } else if (remaining.length >= 2) {
      runSpin(remaining);
    }
  };

  const cardCount = Math.max(1, movies.length);
  // 48px = 24px left + 24px right page padding
  const availableWidth = Math.min(672, viewportWidth - 48);
  const effectiveOffset =
    cardCount <= 1
      ? CARD_OFFSET
      : Math.min(
          CARD_OFFSET,
          Math.floor((availableWidth - CARD_WIDTH) / (cardCount - 1)),
        );
  const deckWidth = CARD_WIDTH + effectiveOffset * (cardCount - 1);
  const containerHeight = CARD_HEIGHT + CONTAINER_TOP_BUFFER;

  const renderFan = () =>
    movies.map((movie, i) => (
      <PosterCard
        key={movie.title}
        movie={movie}
        index={i}
        offset={effectiveOffset}
        isHovered={hoveredIndex === i}
        isActive={activeIndex === i && isShuffling}
        isWinner={winnerMovie?.title === movie.title && !isShuffling}
        isShuffling={isShuffling}
        isFlipped={flippedCards.has(i)}
        nudge={hoveredIndex === null ? 0 : (i - hoveredIndex) * 45}
        onHoverStart={() => setHoveredIndex(i)}
        onHoverEnd={() => setHoveredIndex(null)}
        onClick={() =>
          !isShuffling && !flippedCards.has(i) && setModalMovie(movie)
        }
        onRemove={() => onRemove(movie)}
      />
    ));

  const btnBase: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    borderRadius: '50px',
    fontWeight: 700,
    fontSize: '0.9rem',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {!shuffleActive && (
        <>
          {movies.length > 0 ? (
            <div
              style={{
                position: 'relative',
                margin: '0 auto',
                width: deckWidth,
                height: containerHeight,
                overflow: 'visible',
              }}
            >
              {renderFan()}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <p
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                }}
              >
                No films in the deck yet.
              </p>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-muted)',
                  marginTop: '4px',
                  fontWeight: 500,
                }}
              >
                Click the button above to add some!
              </p>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <motion.button
              onClick={handleShuffle}
              disabled={movies.length < 2}
              whileHover={movies.length >= 2 ? { scale: 1.04 } : {}}
              whileTap={movies.length >= 2 ? { scale: 0.96 } : {}}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              style={{
                ...btnBase,
                padding: '12px 28px',
                background:
                  movies.length < 2
                    ? 'var(--color-surface-2)'
                    : 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)',
                border:
                  movies.length < 2 ? '1px solid var(--color-border)' : 'none',
                color: movies.length < 2 ? 'var(--color-muted)' : 'white',
                boxShadow:
                  movies.length < 2 ? 'none' : '0 0 24px rgba(255,128,0,0.22)',
                cursor: movies.length < 2 ? 'not-allowed' : 'pointer',
              }}
            >
              Shuffle
            </motion.button>

            {movies.length > 0 && (
              <button
                onClick={() => {
                  onClear();
                  setFlippedCards(new Set());
                }}
                style={{
                  ...btnBase,
                  padding: '11px 20px',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.85rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    'var(--color-border-light)';
                  e.currentTarget.style.color = 'var(--color-text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {movies.length === 1 && (
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.85rem',
                color: 'var(--color-muted)',
                fontWeight: 500,
              }}
            >
              Add at least one more film to shuffle.
            </p>
          )}
        </>
      )}

      {/* Fullscreen shuffle overlay */}
      <AnimatePresence>
        {shuffleActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(10,14,18,0.92)',
                backdropFilter: 'blur(14px)',
              }}
            />

            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                zIndex: 10,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-danger)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = 'var(--color-danger)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-surface-2)';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              ✕
            </button>

            <AnimatePresence mode="wait">
              {watchAccepted && winnerMovie ? (
                /* Winner reveal - same width as MovieModal */
                <motion.div
                  key="reveal"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.34, 1.2, 0.64, 1] }}
                  style={{
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--color-accent)',
                    }}
                  >
                    Tonight you're watching
                  </p>
                  {/* Same width as MovieModal for consistency */}
                  <div
                    style={{
                      width: '380px',
                      maxWidth: '85vw',
                      maxHeight: '75svh',
                      overflowY: 'auto',
                      borderRadius: '14px',
                    }}
                  >
                    <MovieCard movie={winnerMovie} />
                  </div>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-muted)',
                      fontWeight: 500,
                    }}
                  >
                    Press{' '}
                    <kbd
                      style={{
                        padding: '2px 7px',
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border-light)',
                        borderRadius: '5px',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      Esc
                    </kbd>{' '}
                    to Close
                  </p>
                </motion.div>
              ) : (
                /* Shuffle / Watch decision */
                <motion.div
                  key="shuffle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '40px',
                  }}
                >
                  {/* Scaled fan */}
                  <div
                    style={{
                      width: deckWidth * OVERLAY_SCALE,
                      height: containerHeight * OVERLAY_SCALE,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          width: deckWidth,
                          height: containerHeight,
                          transform: `scale(${OVERLAY_SCALE})`,
                          transformOrigin: 'center center',
                        }}
                      >
                        {renderFan()}
                      </div>
                    </div>
                  </div>

                  {/* Winner title + year below the fan, then action buttons */}
                  <div
                    style={{
                      minHeight: 96,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '16px',
                    }}
                  >
                    <AnimatePresence>
                      {winnerMovie && !isShuffling && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.22 }}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px',
                          }}
                        >
                          {/* Title and year below the fan */}
                          <div style={{ textAlign: 'center' }}>
                            <p
                              style={{
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                color: 'var(--color-text)',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.2,
                              }}
                            >
                              {winnerMovie.title}
                            </p>
                            {(winnerMovie.year || winnerMovie.rating) && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '10px',
                                  marginTop: '4px',
                                }}
                              >
                                {winnerMovie.year && (
                                  <span
                                    style={{
                                      fontSize: '0.9rem',
                                      color: 'var(--color-text-secondary)',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {winnerMovie.year}
                                  </span>
                                )}
                                {winnerMovie.rating && (
                                  <span
                                    style={{
                                      fontSize: '0.9rem',
                                      color: 'var(--color-green)',
                                      fontWeight: 700,
                                    }}
                                  >
                                    ★ {winnerMovie.rating.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={handleWatchThis}
                              style={{
                                ...btnBase,
                                padding: '13px 28px',
                                background:
                                  'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)',
                                border: 'none',
                                color: 'white',
                                boxShadow: '0 0 24px rgba(255,128,0,0.3)',
                              }}
                            >
                              Watch This!
                            </button>
                            <button
                              onClick={handleEliminate}
                              style={{
                                ...btnBase,
                                padding: '12px 20px',
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-secondary)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor =
                                  'var(--color-border-light)';
                                e.currentTarget.style.color =
                                  'var(--color-text)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor =
                                  'var(--color-border)';
                                e.currentTarget.style.color =
                                  'var(--color-text-secondary)';
                              }}
                            >
                              Eliminate & Shuffle Again
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {modalMovie && (
        <MovieModal movie={modalMovie} onClose={() => setModalMovie(null)} />
      )}
    </div>
  );
};

export default MovieDeck;
