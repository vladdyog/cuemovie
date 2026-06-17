import React from 'react';

import type { Movie } from '../types';
import GenrePill from './GenrePill';

type Props = {
  movie: Movie;
  compact?: boolean;
};

const PosterPlaceholder = ({ size }: { size: 'sm' | 'lg' }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background:
        'linear-gradient(135deg, var(--color-surface-2) 0%, var(--color-border) 100%)',
      fontSize: size === 'lg' ? '3rem' : '1.8rem',
      opacity: 0.3,
    }}
  >
    🎬
  </div>
);

const RatingBadge: React.FC<{ rating: number }> = ({ rating }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      color: 'var(--color-green)',
      fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
      fontSize: 'var(--text-base)',
    }}
  >
    ★ {rating.toFixed(1)}
  </span>
);

const MovieCard: React.FC<Props> = ({ movie, compact = false }) => {
  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          gap: '16px',
          padding: '14px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-accent)';
          e.currentTarget.style.boxShadow =
            '0 0 0 1px var(--color-accent), 0 0 16px rgba(255,128,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Compact poster */}
        <div
          style={{
            flexShrink: 0,
            width: '56px',
            height: '80px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            border: '1px solid var(--color-border)',
          }}
        >
          {movie.poster ? (
            <img
              src={movie.poster}
              alt={movie.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <PosterPlaceholder size="sm" />
          )}
        </div>

        {/* Info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            minWidth: 0,
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-md)',
              fontWeight:
                'var(--weight-bold)' as React.CSSProperties['fontWeight'],
              color: 'var(--color-text)',
              lineHeight: 1.3,
            }}
          >
            {movie.title}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {movie.year && (
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  fontWeight:
                    'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                }}
              >
                {movie.year}
              </span>
            )}
            {movie.runtime && (
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  fontWeight:
                    'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                }}
              >
                {movie.runtime} min
              </span>
            )}
            {movie.rating && <RatingBadge rating={movie.rating} />}
          </div>
          {movie.genres && movie.genres.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {movie.genres.slice(0, 2).map((g) => (
                <GenrePill key={g} genre={g} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        overflow: 'hidden',
      }}
    >
      {/* Poster */}
      <div
        style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}
      >
        {movie.poster ? (
          <>
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
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '40%',
                background:
                  'linear-gradient(to top, var(--color-surface) 0%, transparent 100%)',
              }}
            />
          </>
        ) : (
          <PosterPlaceholder size="lg" />
        )}
      </div>

      {/* Info */}
      <div
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <p
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight:
              'var(--weight-display)' as React.CSSProperties['fontWeight'],
            color: 'var(--color-text)',
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}
        >
          {movie.title}
        </p>

        {/* Meta row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {movie.year && (
            <span
              style={{
                fontSize: 'var(--text-base)',
                fontWeight:
                  'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                color: 'var(--color-text-secondary)',
              }}
            >
              {movie.year}
            </span>
          )}
          {movie.runtime && (
            <span
              style={{
                fontSize: 'var(--text-base)',
                fontWeight:
                  'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                color: 'var(--color-text-secondary)',
              }}
            >
              {movie.runtime} min
            </span>
          )}
          {movie.rating && <RatingBadge rating={movie.rating} />}
        </div>

        {/* Genre pills */}
        {movie.genres && movie.genres.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {movie.genres.map((g) => (
              <GenrePill key={g} genre={g} />
            ))}
          </div>
        )}

        {/* Overview */}
        {movie.overview && (
          <p
            style={{
              fontSize: 'var(--text-base)',
              lineHeight: 1.65,
              color: 'var(--color-text-secondary)',
              fontWeight:
                'var(--weight-normal)' as React.CSSProperties['fontWeight'],
              marginTop: '4px',
            }}
          >
            {movie.overview}
          </p>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
