import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect } from 'react';

import type { Movie } from '../types';
import MovieCard from './MovieCard';

type Props = {
  movie: Movie;
  onClose: () => void;
};

const MovieModal: React.FC<Props> = ({ movie, onClose }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
        initial={{
          backgroundColor: 'rgba(0,0,0,0)',
          backdropFilter: 'blur(0px)',
        }}
        animate={{
          backgroundColor: 'rgba(10,12,16,0.88)',
          backdropFilter: 'blur(10px)',
        }}
        exit={{ backgroundColor: 'rgba(0,0,0,0)', backdropFilter: 'blur(0px)' }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      >
        <motion.div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '380px',
            maxHeight: '90svh',
            display: 'flex',
            flexDirection: 'column',
          }}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ duration: 0.25, ease: [0.34, 1.3, 0.64, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '-14px',
              right: '-14px',
              zIndex: 10,
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border-light)',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-base)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-danger)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = 'var(--color-danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-surface-2)';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
              e.currentTarget.style.borderColor = 'var(--color-border-light)';
            }}
          >
            ✕
          </button>

          {/* Card */}
          <div style={{ overflowY: 'auto', borderRadius: 'var(--radius-lg)' }}>
            <MovieCard movie={movie} />
          </div>

          {/* Hint */}
          <p
            style={{
              textAlign: 'center',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-muted)',
              marginTop: '14px',
              fontWeight:
                'var(--weight-medium)' as React.CSSProperties['fontWeight'],
              flexShrink: 0,
            }}
          >
            Press{' '}
            <kbd
              style={{
                padding: '2px 7px',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-body)',
              }}
            >
              Esc
            </kbd>{' '}
            or Click Outside to Close
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MovieModal;
