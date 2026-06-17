import React from 'react';

interface CloseButtonProps {
  onClick: () => void;
  /**
   * 'inset'   — sits inside the panel, top-right corner (default)
   * 'floating' — positioned outside/above the panel edge (e.g. MovieModal)
   */
  variant?: 'inset' | 'floating';
}

const CloseButton: React.FC<CloseButtonProps> = ({
  onClick,
  variant = 'inset',
}) => {
  const [hovered, setHovered] = React.useState(false);

  const size = variant === 'floating' ? '36px' : '28px';
  const position: React.CSSProperties =
    variant === 'floating'
      ? { top: '-14px', right: '-14px' }
      : { top: '14px', right: '14px' };

  return (
    <button
      onClick={onClick}
      aria-label="Close"
      style={{
        position: 'absolute',
        ...position,
        zIndex: 10,
        width: size,
        height: size,
        borderRadius: '50%',
        background: hovered ? 'var(--color-danger)' : 'var(--color-surface-2)',
        border: `1px solid ${hovered ? 'var(--color-danger)' : 'var(--color-border)'}`,
        color: hovered ? 'white' : 'var(--color-text-secondary)',
        fontSize: 'var(--text-xs)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        transition: 'background 0.15s, border-color 0.15s, color 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      ✕
    </button>
  );
};

export default CloseButton;
