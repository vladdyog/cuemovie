import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

import logo from '/CueMovie_transparent.png';

import Button from './Button';

type Category = 'Bug Report' | 'Feature Idea' | 'General';
type Status = 'idle' | 'submitting' | 'success' | 'error';

const CATEGORIES: Category[] = ['Bug Report', 'Feature Idea', 'General'];

const COLOR_TRANSITION =
  'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease';

const CATEGORY_COLORS: Record<
  Category,
  { color: string; bg: string; border: string }
> = {
  'Bug Report': {
    color: 'var(--color-danger)',
    bg: 'var(--color-danger-subtle)',
    border: 'var(--color-danger)',
  },
  'Feature Idea': {
    color: 'var(--color-blue)',
    bg: 'var(--color-blue-subtle)',
    border: 'var(--color-blue)',
  },
  General: {
    color: 'var(--color-accent)',
    bg: 'var(--color-accent-subtle)',
    border: 'var(--color-accent)',
  },
};

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  fontSize: 'var(--text-sm)',
  fontWeight: 'var(--weight-normal)' as React.CSSProperties['fontWeight'],
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
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--color-text-secondary)',
      marginBottom: '6px',
    }}
  >
    {children}
  </p>
);

const FeedbackButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>('General');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [open]);

  const handleClose = () => {
    if (status === 'submitting') return;
    setOpen(false);
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
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-light)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-base)',
          fontWeight:
            'var(--weight-medium)' as React.CSSProperties['fontWeight'],
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
                borderRadius: 'var(--radius-lg)',
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
                  fontSize: 'var(--text-xs)',
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
                        fontSize: 'var(--text-md)',
                        fontWeight:
                          'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                        color: 'var(--color-text)',
                      }}
                    >
                      Thank you!
                    </p>
                    <p
                      style={{
                        fontSize: 'var(--text-base)',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.6,
                      }}
                    >
                      Every message helps make CueMovie better.
                    </p>
                  </motion.div>
                ) : (
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
                          fontSize: 'var(--text-md)',
                          fontWeight:
                            'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                          color: 'var(--color-text)',
                        }}
                      >
                        Share your thoughts with us!
                      </p>
                      <p
                        style={{
                          fontSize: 'var(--text-sm)',
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
                                borderRadius: 'var(--radius-md)',
                                border: `1px solid ${active ? border : 'var(--color-border)'}`,
                                background: active
                                  ? bg
                                  : 'var(--color-surface-2)',
                                color: active
                                  ? color
                                  : 'var(--color-text-secondary)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: active
                                  ? ('var(--weight-bold)' as React.CSSProperties['fontWeight'])
                                  : ('var(--weight-medium)' as React.CSSProperties['fontWeight']),
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
                          fontSize: 'var(--text-xs)',
                          fontWeight:
                            'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                          marginTop: '5px',
                          color: 'var(--color-muted)',
                        }}
                      >
                        Minimum 10 characters.
                      </p>
                    </div>

                    {/* Email */}
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

                    {/* Error */}
                    {status === 'error' && (
                      <p
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-danger)',
                          fontWeight:
                            'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                        }}
                      >
                        Something went wrong - please try again.
                      </p>
                    )}

                    {/* Submit */}
                    <Button
                      variant={canSubmit ? 'primary' : 'surface'}
                      size="md"
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      style={{
                        width: '100%',
                        borderRadius: 'var(--radius-md)',
                        justifyContent: 'center',
                        boxShadow: canSubmit
                          ? '0 0 20px rgba(255,128,0,0.25)'
                          : 'none',
                      }}
                    >
                      {status === 'submitting' ? 'Sending…' : 'Send Feedback'}
                    </Button>
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
