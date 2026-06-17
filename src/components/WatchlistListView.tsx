import React, { useState } from 'react';

import type { Movie } from '../types';
import Button from './Button';
import GenrePill from './GenrePill';

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

function formatRuntime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const MovieRow: React.FC<{
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
    if (selectMode) onToggleSelect(key);
    else onClick(movie);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        borderRadius: 'var(--radius-md)',
        transition: 'background 0.1s',
        background: selected
          ? 'var(--color-accent-subtle)'
          : hovered
            ? 'var(--color-surface-2)'
            : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Checkbox — visible in select mode */}
      {selectMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(key);
          }}
          style={{
            flexShrink: 0,
            width: '18px',
            height: '18px',
            borderRadius: 'var(--radius-sm)',
            border: `2px solid ${selected ? 'var(--color-accent)' : 'var(--color-border-light)'}`,
            background: selected ? 'var(--color-accent)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          {selected && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2 5L4 7.5L8 2.5"
                stroke="white"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      )}
      {/* Spacer when checkbox hidden to keep layout stable */}
      {!selectMode && <div style={{ flexShrink: 0, width: '18px' }} />}

      {/* Poster thumbnail */}
      <div
        style={{
          width: 42,
          height: 63,
          flexShrink: 0,
          borderRadius: 'var(--radius-sm)',
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
              fontSize: 'var(--text-md)',
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
            fontSize: 'var(--text-base)',
            fontWeight:
              'var(--weight-bold)' as React.CSSProperties['fontWeight'],
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
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
            marginTop: '3px',
            flexWrap: 'wrap',
          }}
        >
          {movie.year && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                fontWeight:
                  'var(--weight-medium)' as React.CSSProperties['fontWeight'],
              }}
            >
              {movie.year}
            </span>
          )}
          {movie.rating !== undefined && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                fontWeight:
                  'var(--weight-medium)' as React.CSSProperties['fontWeight'],
              }}
            >
              ★ {movie.rating.toFixed(1)}
            </span>
          )}
          {movie.runtime ? (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-muted)',
                fontWeight:
                  'var(--weight-medium)' as React.CSSProperties['fontWeight'],
              }}
            >
              {formatRuntime(movie.runtime)}
            </span>
          ) : null}
        </div>
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
              <GenrePill key={g} genre={g} />
            ))}
          </div>
        )}
      </div>

      {/* Remove button — only in non-select mode */}
      {!selectMode && (
        <Button
          variant="surface"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(movie);
          }}
          style={{
            flexShrink: 0,
            opacity: hovered ? 1 : 0,
            pointerEvents: hovered ? 'auto' : 'none',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              'var(--color-danger-subtle)';
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              'var(--color-danger)';
            (e.currentTarget as HTMLButtonElement).style.color =
              'var(--color-danger)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              'var(--color-surface-2)';
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              'var(--color-border)';
            (e.currentTarget as HTMLButtonElement).style.color =
              'var(--color-text-secondary)';
          }}
        >
          Remove
        </Button>
      )}
    </div>
  );
};

const WatchlistListView: React.FC<Props> = ({
  movies,
  selectedKeys,
  selectMode,
  onRemove,
  onMovieClick,
  onToggleSelect,
}) => (
  <div>
    {movies.map((movie) => (
      <MovieRow
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

export default WatchlistListView;
