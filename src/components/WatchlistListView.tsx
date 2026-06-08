import React, { useState } from 'react';

import type { Movie } from '../types';

type Props = {
  movies: Movie[];
  onRemove: (movie: Movie) => void;
  onMovieClick: (movie: Movie) => void;
};

function formatRuntime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const MovieRow: React.FC<{
  movie: Movie;
  onRemove: (movie: Movie) => void;
  onClick: (movie: Movie) => void;
}> = ({ movie, onRemove, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '10px 10px',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        borderRadius: '6px',
        transition: 'background 0.1s',
        background: hovered ? 'var(--color-surface-2)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(movie)}
    >
      {/* Poster thumbnail */}
      <div
        style={{
          width: 42,
          height: 63,
          flexShrink: 0,
          borderRadius: '4px',
          overflow: 'hidden',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
        }}
      >
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              opacity: 0.4,
            }}
          >
            🎬
          </div>
        )}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}
        >
          {movie.title}
        </p>

        {/* Metadata row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '3px',
            flexWrap: 'wrap',
          }}
        >
          {movie.year && (
            <span
              style={{
                fontSize: '0.775rem',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
              }}
            >
              {movie.year}
            </span>
          )}
          {movie.rating !== undefined && (
            <span
              style={{
                fontSize: '0.775rem',
                color: 'var(--color-text-secondary)',
                fontWeight: 500,
              }}
            >
              ★ {movie.rating.toFixed(1)}
            </span>
          )}
          {movie.runtime ? (
            <span
              style={{
                fontSize: '0.775rem',
                color: 'var(--color-muted)',
                fontWeight: 500,
              }}
            >
              {formatRuntime(movie.runtime)}
            </span>
          ) : null}
        </div>

        {/* Genre pills */}
        {movie.genres && movie.genres.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '4px',
              marginTop: '5px',
              overflow: 'hidden',
            }}
          >
            {movie.genres.slice(0, 3).map((g) => (
              <span
                key={g}
                style={{
                  fontSize: '0.67rem',
                  fontWeight: 600,
                  color: 'var(--color-muted)',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  padding: '1px 6px',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                }}
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(movie);
        }}
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: '6px',
          border: '1px solid var(--color-border)',
          background: 'transparent',
          color: 'var(--color-muted)',
          fontSize: '0.7rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-body)',
          opacity: hovered ? 1 : 0,
          transition:
            'opacity 0.15s, background 0.15s, border-color 0.15s, color 0.15s',
          pointerEvents: hovered ? 'auto' : 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(229,83,83,0.1)';
          e.currentTarget.style.borderColor = 'var(--color-danger)';
          e.currentTarget.style.color = 'var(--color-danger)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.color = 'var(--color-muted)';
        }}
      >
        ✕
      </button>
    </div>
  );
};

const WatchlistListView: React.FC<Props> = ({
  movies,
  onRemove,
  onMovieClick,
}) => (
  <div>
    {movies.map((movie) => (
      <MovieRow
        key={`${movie.title}::${movie.year ?? ''}`}
        movie={movie}
        onRemove={onRemove}
        onClick={onMovieClick}
      />
    ))}
  </div>
);

export default WatchlistListView;
