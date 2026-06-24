import React, { useState } from 'react';

import type { Movie } from '../types';

type Props = {
  movies: Movie[];
  selectedKeys: Set<string>;
  selectMode: boolean;
  onRemove: (movie: Movie) => void;
  onMovieClick: (movie: Movie) => void;
  onToggleSelect: (key: string) => void;
};

function movieKey(m: Movie): string {
  return `${m.title}::${m.year ?? ''}`;
}

const PosterCard: React.FC<{
  movie: Movie;
  selected: boolean;
  selectMode: boolean;
  onRemove: (movie: Movie) => void;
  onClick: (movie: Movie) => void;
  onToggleSelect: (key: string) => void;
}> = ({ movie, selected, selectMode, onRemove, onClick, onToggleSelect }) => {
  const [hovered, setHovered] = useState(false);
  const key = movieKey(movie);

  const handleClick = () => {
    if (selectMode) {
      onToggleSelect(key);
    } else {
      onClick(movie);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '2/3',
        background: 'var(--color-surface-2)',
        border: '1px solid',
        borderColor:
          selected || hovered ? 'var(--color-accent)' : 'var(--color-border)',
        boxShadow:
          selected || hovered
            ? '0 0 0 1px var(--color-accent), 0 4px 24px rgba(255,128,0,0.18)'
            : 'none',
        transition: 'border-color 0.18s, box-shadow 0.18s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Poster image */}
      {movie.poster ? (
        <img
          src={movie.poster}
          alt={movie.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.25s ease',
            transform: hovered && !selectMode ? 'scale(1.05)' : 'scale(1)',
            opacity: selected ? 0.7 : 1,
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px',
          }}
        >
          <span style={{ fontSize: '1.6rem', opacity: 0.4 }}>🎬</span>
          <p
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight:
                'var(--weight-medium)' as React.CSSProperties['fontWeight'],
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.3,
              wordBreak: 'break-word',
            }}
          >
            {movie.title}
          </p>
        </div>
      )}

      {/* Bottom gradient + title */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 45%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '8px 7px 7px',
          pointerEvents: 'none',
        }}
      >
        <p
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight:
              'var(--weight-bold)' as React.CSSProperties['fontWeight'],
            color: 'white',
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {movie.title}
        </p>
        {movie.year && (
          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'rgba(255,255,255,0.55)',
              fontWeight:
                'var(--weight-medium)' as React.CSSProperties['fontWeight'],
              marginTop: '2px',
            }}
          >
            {movie.year}
          </p>
        )}
      </div>

      {/* Checkbox - top-left, visible in select mode */}
      {selectMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(key);
          }}
          style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            width: '20px',
            height: '20px',
            borderRadius: 'var(--radius-sm)',
            border: `2px solid ${selected ? 'var(--color-accent)' : 'rgba(255,255,255,0.6)'}`,
            background: selected ? 'var(--color-accent)' : 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          {selected && (
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path
                d="M2 5.5L4.5 8L9 3"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      )}

      {/* X remove button - only in non-select mode */}
      {!selectMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(movie);
          }}
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.65)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.75)',
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-body)',
            transition: 'opacity 0.15s, background 0.15s, border-color 0.15s',
            opacity: hovered ? 1 : 0,
            pointerEvents: hovered ? 'auto' : 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(229,83,83,0.85)';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.65)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

const WatchlistGrid: React.FC<Props> = ({
  movies,
  selectedKeys,
  selectMode,
  onRemove,
  onMovieClick,
  onToggleSelect,
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: '10px',
    }}
  >
    {movies.map((movie) => (
      <PosterCard
        key={movieKey(movie)}
        movie={movie}
        selected={selectedKeys.has(movieKey(movie))}
        selectMode={selectMode}
        onRemove={onRemove}
        onClick={onMovieClick}
        onToggleSelect={onToggleSelect}
      />
    ))}
  </div>
);

export default WatchlistGrid;
