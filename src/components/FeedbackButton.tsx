import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

import logo from '/CueMovie_transparent.png';

type Category = 'Bug Report' | 'Feature Idea' | 'General';
type Status = 'idle' | 'submitting' | 'success' | 'error';

const CATEGORIES: Category[] = ['Bug Report', 'Feature Idea', 'General'];

const COLOR_TRANSITION =
  'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease';

// Per-category colour tokens
const CATEGORY_COLORS: Record<
  Category,
  { color: string; bg: string; border: string }
> = {
  'Bug Report': {
    color: 'var(--color-danger)',
    bg: 'rgba(229,83,83,0.1)',
    border: 'var(--color-danger)',
  },
  'Feature Idea': {
    color: 'var(--color-blue)',
    bg: 'rgba(64,188,244,0.1)',
    border: 'var(--color-blue)',
  },
  General: {
    color: 'var(--color-accent)',
    bg: 'rgba(255,128,0,0.1)',
    border: 'var(--color-accent)',
  },
};

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--color-text)',
  fontSize: '0.82rem',
  fontWeight: 400,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  transition: COLOR_TRANSITION,
};

const FocusInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { focusColor?: string }
>(({ focusColor = 'var(--color-accent)', ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    style={{ ...inputBase, padding: '10px 14px', ...props.style }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = focusColor;
      e.currentTarget.style.boxShadow = `0 0 0 3px color-mix(in srgb, ${focusColor} 12%, transparent)`;
      props.onFocus?.(e);
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = 'var(--color-border)';
      e.currentTarget.style.boxShadow = 'none';
      props.onBlur?.(e);
    }}
  />
));
FocusInput.displayName = 'FocusInput';

const FocusTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { focusColor?: string }
>(({ focusColor = 'var(--color-accent)', ...props }, ref) => (
  <textarea
    ref={ref}
    {...props}
    style={{
      ...inputBase,
      padding: '10px 14px',
      resize: 'vertical',
      minHeight: '110px',
      lineHeight: 1.6,
      ...props.style,
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = focusColor;
      e.currentTarget.style.boxShadow = `0 0 0 3px color-mix(in srgb, ${focusColor} 12%, transparent)`;
      props.onFocus?.(e);
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = 'var(--color-border)';
      e.currentTarget.style.boxShadow = 'none';
      props.onBlur?.(e);
    }}
  />
));
FocusTextarea.displayName = 'FocusTextarea';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p
    style={{
      fontSize: '0.72rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--color-text-secondary)',
      marginBottom: '6px',
    }}
  >
    {children}
  </p>
);

// Main component

const FeedbackButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>('General');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus textarea when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [open]);

  const handleClose = () => {
    if (status === 'submitting') return;
    setOpen(false);
    // Reset after exit animation
    setTimeout(() => {
      setMessage('');
      setEmail('');
      setCategory('General');
      setStatus('idle');
    }, 300);
  };

  const handleSubmit = async () => {
    if (!message.trim() || status === 'submitting') return;
    setStatus('submitting');

    try {
      const res = await fetch('/api/feedbackFunction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: message.trim(),
          ...(email.trim() ? { _replyto: email.trim() } : {}),
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const canSubmit = message.trim().length >= 10 && status === 'idle';

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        aria-label="Share feedback"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '10px 18px',
          borderRadius: '999px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-light)',
          color: 'var(--color-text-secondary)',
          fontSize: '0.85rem',
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          transition: COLOR_TRANSITION,
          letterSpacing: '-0.01em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-accent)';
          e.currentTarget.style.color = 'var(--color-accent)';
          e.currentTarget.style.boxShadow =
            '0 4px 24px rgba(255,128,0,0.2), 0 0 0 1px var(--color-accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-light)';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
        }}
      >
        <img
          src={logo}
          alt=""
          style={{ width: '18px', height: '18px', objectFit: 'contain' }}
        />
        Got some feedback?
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="feedback-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              padding: '16px',
              paddingBottom: '80px',
            }}
            initial={{
              backgroundColor: 'rgba(0,0,0,0)',
              backdropFilter: 'blur(0px)',
            }}
            animate={{
              backgroundColor: 'rgba(10,12,16,0.6)',
              backdropFilter: 'blur(6px)',
            }}
            exit={{
              backgroundColor: 'rgba(0,0,0,0)',
              backdropFilter: 'blur(0px)',
            }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop catches outside clicks */}
            <div
              onClick={handleClose}
              style={{ position: 'absolute', inset: 0, cursor: 'default' }}
            />

            <motion.div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '380px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-light)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}
              initial={{ opacity: 0, scale: 0.93, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.25, ease: [0.34, 1.2, 0.64, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={handleClose}
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
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                ✕
              </button>

              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  /* Success state */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '12px',
                      padding: '16px 0 8px',
                    }}
                  >
                    <img
                      src={logo}
                      alt=""
                      style={{
                        width: '52px',
                        height: '52px',
                        objectFit: 'contain',
                      }}
                    />
                    <p
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--color-text)',
                      }}
                    >
                      Thank you!
                    </p>
                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.6,
                      }}
                    >
                      Every message helps make CueMovie better.
                    </p>
                  </motion.div>
                ) : (
                  /* Form state */
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    {/* Header */}
                    <div>
                      <p
                        style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: 'var(--color-text)',
                        }}
                      >
                        Share your thoughts with us!
                      </p>
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-text-secondary)',
                          marginTop: '2px',
                        }}
                      >
                        Bug, idea, or just a question - all are welcome.
                      </p>
                    </div>

                    {/* Category */}
                    <div>
                      <Label>Category</Label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {CATEGORIES.map((cat) => {
                          const active = category === cat;
                          const { color, bg, border } = CATEGORY_COLORS[cat];
                          return (
                            <button
                              key={cat}
                              onClick={() => setCategory(cat)}
                              style={{
                                flex: 1,
                                padding: '7px 4px',
                                borderRadius: '8px',
                                border: `1px solid ${active ? border : 'var(--color-border)'}`,
                                background: active
                                  ? bg
                                  : 'var(--color-surface-2)',
                                color: active
                                  ? color
                                  : 'var(--color-text-secondary)',
                                fontSize: '0.78rem',
                                fontWeight: active ? 700 : 500,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-body)',
                                transition: COLOR_TRANSITION,
                              }}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <Label>Message</Label>
                      <FocusTextarea
                        ref={textareaRef}
                        placeholder="What's on your mind?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={status === 'submitting'}
                        focusColor={CATEGORY_COLORS[category].color}
                      />
                      <p
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          marginTop: '5px',
                          color: 'var(--color-muted)',
                        }}
                      >
                        Minimum 10 characters.
                      </p>
                    </div>

                    {/* Email (optional) */}
                    <div>
                      <Label>Email (optional)</Label>
                      <FocusInput
                        type="email"
                        placeholder="If you want a reply"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={status === 'submitting'}
                        focusColor={CATEGORY_COLORS[category].color}
                      />
                    </div>

                    {/* Error message */}
                    {status === 'error' && (
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-danger)',
                          fontWeight: 500,
                        }}
                      >
                        Something went wrong - please try again.
                      </p>
                    )}

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      style={{
                        padding: '11px',
                        borderRadius: '8px',
                        border: 'none',
                        background: canSubmit
                          ? 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)'
                          : 'var(--color-surface-2)',
                        color: canSubmit ? 'white' : 'var(--color-muted)',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                        fontFamily: 'var(--font-body)',
                        letterSpacing: '-0.01em',
                        boxShadow: canSubmit
                          ? '0 0 20px rgba(255,128,0,0.25)'
                          : 'none',
                        transition: COLOR_TRANSITION,
                      }}
                    >
                      {status === 'submitting' ? 'Sending…' : 'Send Feedback'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackButton;
