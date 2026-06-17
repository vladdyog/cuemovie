import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'surface' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const styles: Record<ButtonVariant, React.CSSProperties> = {
  // Filled orange — one per section max, highest-priority action
  primary: {
    background: 'var(--color-accent)',
    color: '#ffffff',
    border: '1px solid transparent',
  },
  // Ghost — important but non-primary actions
  secondary: {
    background: 'transparent',
    color: 'var(--color-accent)',
    border: '1px solid var(--color-accent)',
  },
  // Low-key controls — view toggles, pagination, sort
  surface: {
    background: 'var(--color-surface-2)',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
  },
  // Destructive actions only — remove, clear, delete
  danger: {
    background: 'transparent',
    color: 'var(--color-danger)',
    border: '1px solid var(--color-danger)',
  },
};

const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: 'var(--color-accent-hover)' },
  secondary: { background: 'var(--color-accent-subtle)' },
  surface: {
    background: 'var(--color-surface-2)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border-light)',
  },
  danger: { background: 'var(--color-danger-subtle)' },
};

const sizes: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    fontSize: 'var(--text-sm)',
    padding: '5px 12px',
    gap: '5px',
  },
  md: {
    fontSize: 'var(--text-base)',
    padding: '9px 18px',
    gap: '7px',
  },
  lg: {
    fontSize: 'var(--text-md)',
    padding: '13px 28px',
    gap: '8px',
  },
};

const Button: React.FC<ButtonProps> = ({
  variant = 'surface',
  size = 'md',
  children,
  style,
  disabled,
  onMouseEnter,
  onMouseLeave,
  ...rest
}) => {
  const [hovered, setHovered] = React.useState(false);

  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
    lineHeight: 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition:
      'background 0.15s, color 0.15s, border-color 0.15s, opacity 0.15s',
    opacity: disabled ? 0.45 : 1,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    ...sizes[size],
    ...styles[variant],
    ...(hovered && !disabled ? hoverStyles[variant] : {}),
    ...style,
  };

  return (
    <button
      style={base}
      disabled={disabled}
      onMouseEnter={(e) => {
        setHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        onMouseLeave?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
