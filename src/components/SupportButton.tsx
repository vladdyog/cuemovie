import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

import logo from '/CueMovie_transparent.png';

const BMAC_URL = 'https://buymeacoffee.com/cuemovie';

const COLOR_TRANSITION =
  'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease';

const SupportButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Footer trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Support CueMovie"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '6px 14px',
          borderRadius: '999px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-light)',
          color: 'var(--color-text-secondary)',
          fontSize: '0.8rem',
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          transition: COLOR_TRANSITION,
          letterSpacing: '-0.01em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-blue)';
          e.currentTarget.style.color = 'var(--color-blue)';
          e.currentTarget.style.boxShadow = '0 0 0 1px var(--color-blue)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-light)';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        Support CueMovie
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="support-overlay"
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
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
              backgroundColor: 'rgba(10,12,16,0.7)',
              backdropFilter: 'blur(6px)',
            }}
            exit={{
              backgroundColor: 'rgba(0,0,0,0)',
              backdropFilter: 'blur(0px)',
            }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-light)',
                borderRadius: '20px',
                padding: '32px 28px 28px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '16px',
              }}
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
            >
              {/* Close */}
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

              {/* Logo */}
              <img
                src={logo}
                alt=""
                style={{ width: '52px', height: '52px', objectFit: 'contain' }}
              />

              {/* Heading */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <p
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    lineHeight: 1.2,
                  }}
                >
                  Enjoying CueMovie?
                </p>
                <p
                  style={{
                    fontSize: '0.88rem',
                    lineHeight: 1.7,
                    color: 'var(--color-text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  If we've helped you pick a movie or two, please consider
                  supporting us - it really helps cover the costs and keep the
                  project alive.
                </p>
              </div>

              {/* Divider */}
              <div
                style={{
                  width: '100%',
                  height: '1px',
                  background: 'var(--color-border)',
                  margin: '4px 0',
                }}
              />

              {/* CTA - solid blue, brightens on hover */}
              <a
                href={BMAC_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  justifyContent: 'center',
                  padding: '13px',
                  borderRadius: '10px',
                  background: 'rgba(64,188,244,0.15)',
                  border: '1px solid rgba(64,188,244,0.4)',
                  color: 'var(--color-blue)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-body)',
                  textDecoration: 'none',
                  letterSpacing: '-0.01em',
                  transition: COLOR_TRANSITION,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(64,188,244,0.25)';
                  e.currentTarget.style.borderColor = 'var(--color-blue)';
                  e.currentTarget.style.boxShadow =
                    '0 0 24px rgba(64,188,244,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(64,188,244,0.15)';
                  e.currentTarget.style.borderColor = 'rgba(64,188,244,0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Buy us a Pizza
              </a>

              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-muted)',
                  fontWeight: 500,
                }}
              >
                No account needed · One-time or recurring, your choice!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportButton;
