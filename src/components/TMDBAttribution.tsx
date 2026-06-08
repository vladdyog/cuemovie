import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

// TMDB short blue logo (approved attribution logo)
const TMDB_LOGO_URL =
  'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg';

const COLOR_TRANSITION =
  'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease';

const TmdbAttribution: React.FC = () => {
  const [open, setOpen] = useState(false);

  // Keyboard dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Footer TMDB logo */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Data attribution - powered by TMDB"
        title="Data attribution"
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'transparent',
          border: 'none',
          padding: '4px 6px',
          borderRadius: '6px',
          cursor: 'pointer',
          opacity: 0.55,
          transition: COLOR_TRANSITION,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.55';
        }}
      >
        <img
          src={TMDB_LOGO_URL}
          alt="TMDB logo"
          style={{ height: '13px', display: 'block' }}
        />
      </button>

      {/* TMDB Attribution modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="tmdb-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
            initial={{
              backgroundColor: 'rgba(0,0,0,0)',
              backdropFilter: 'blur(0px)',
            }}
            animate={{
              backgroundColor: 'rgba(10,12,16,0.75)',
              backdropFilter: 'blur(8px)',
            }}
            exit={{
              backgroundColor: 'rgba(0,0,0,0)',
              backdropFilter: 'blur(0px)',
            }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-light)',
                borderRadius: '18px',
                padding: '32px 28px 28px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              }}
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-body)',
                  transition: COLOR_TRANSITION,
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

              {/* Heading */}
              <p
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                  marginBottom: '14px',
                  textAlign: 'center',
                }}
              >
                Credits &amp; Attribution
              </p>

              {/* Divider */}
              <div
                style={{
                  height: '1px',
                  background: 'var(--color-border)',
                  marginBottom: '30px',
                }}
              />

              {/* TMDB block */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '30px',
                  alignItems: 'center',
                  textAlign: 'center',
                }}
              >
                <a
                  href="https://www.themoviedb.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <img
                    src={TMDB_LOGO_URL}
                    alt="The Movie Database (TMDB)"
                    style={{ height: '40px', display: 'block' }}
                  />
                </a>

                <p
                  style={{
                    fontSize: '0.85rem',
                    lineHeight: 1.65,
                    color: 'var(--color-text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  This website uses the The Movie Database (TMDB) API but is not
                  endorsed or certified by TMDB.
                </p>

                <p
                  style={{
                    fontSize: '0.80rem',
                    lineHeight: 1.6,
                    color: 'var(--color-muted)',
                    fontWeight: 400,
                  }}
                >
                  All additional movie metadata, posters, and ratings are
                  provided by{' '}
                  <a
                    href="https://www.themoviedb.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--color-text-secondary)',
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    The Movie Database (TMDB)
                  </a>
                  , an amazing community-built movie and TV database.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TmdbAttribution;
