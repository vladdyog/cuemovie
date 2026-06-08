import React, { useState } from 'react';

import type { Movie } from '../types';

type Props = {
  movies: Movie[];
  onRemove: (movie: Movie) => void;
  onMovieClick: (movie: Movie) => void;
};

const PosterCard: React.FC<{
  movie: Movie;
  onRemove: (movie: Movie) => void;
  onClick: (movie: Movie) => void;
}> = ({ movie, onRemove, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '2/3',
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(movie)}
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
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
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
              fontSize: '0.7rem',
              fontWeight: 600,
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

      {/* Bottom gradient + title overlay */}
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
            fontSize: '0.68rem',
            fontWeight: 700,
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
              fontSize: '0.62rem',
              color: 'rgba(255,255,255,0.55)',
              fontWeight: 500,
              marginTop: '2px',
            }}
          >
            {movie.year}
          </p>
        )}
      </div>

      {/* Remove button - visible on hover */}
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
          fontSize: '0.65rem',
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
    </div>
  );
};

const WatchlistGrid: React.FC<Props> = ({ movies, onRemove, onMovieClick }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
      gap: '10px',
    }}
  >
    {movies.map((movie) => (
      <PosterCard
        key={`${movie.title}::${movie.year ?? ''}`}
        movie={movie}
        onRemove={onRemove}
        onClick={onMovieClick}
      />
    ))}
  </div>
);

export default WatchlistGrid;
