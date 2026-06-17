import { motion } from 'framer-motion';
import React from 'react';

import type { Movie } from '../types';
import Button from './Button';
import MovieCard from './MovieCard';

type Props = {
  movie: Movie;
  onCardClick: () => void;
  onRemove?: (movie: Movie) => void;
};

const TonightsPick: React.FC<Props> = ({ movie, onCardClick, onRemove }) => (
  <motion.div
    key={movie.title}
    style={{ width: '100%', maxWidth: '420px' }}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 12 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
  >
    {/* Divider label */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '14px',
      }}
    >
      <div
        style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}
      />
      <p
        style={{
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
        }}
      >
        Tonight's Pick
      </p>
      <div
        style={{ flex: 1, height: '1px', background: 'var(--color-border)' }}
      />
    </div>

    {/* Compact card */}
    <div style={{ cursor: 'pointer' }} onClick={onCardClick}>
      <MovieCard movie={movie} compact />
    </div>

    {/* Hint */}
    <p
      style={{
        textAlign: 'center',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-muted)',
        marginTop: '10px',
        fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
      }}
    >
      Click to Expand
    </p>

    {/* Watch & remove */}
    {onRemove && (
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <Button
          variant="surface"
          size="sm"
          onClick={() => onRemove(movie)}
          style={{
            borderRadius: 'var(--radius-md)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              'var(--color-danger)';
            (e.currentTarget as HTMLButtonElement).style.color =
              'var(--color-danger)';
            (e.currentTarget as HTMLButtonElement).style.background =
              'var(--color-danger-subtle)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              'var(--color-border)';
            (e.currentTarget as HTMLButtonElement).style.color =
              'var(--color-text-secondary)';
            (e.currentTarget as HTMLButtonElement).style.background =
              'var(--color-surface-2)';
          }}
        >
          Watch &amp; Remove From List
        </Button>
      </div>
    )}
  </motion.div>
);

export default TonightsPick;
