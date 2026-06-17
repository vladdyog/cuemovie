import React from 'react';

interface SectionLabelProps {
  children: React.ReactNode;
  noMargin?: boolean;
}

/**
 * Small-caps section heading used consistently across all tabs.
 * Orange accent color, uppercase, tight letter-spacing.
 * Use once per logical section to introduce its content.
 */
const SectionLabel: React.FC<SectionLabelProps> = ({ children, noMargin }) => (
  <h2
    style={{
      fontSize: 'var(--text-base)',
      fontWeight: 'var(--weight-bold)' as React.CSSProperties['fontWeight'],
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: 'var(--color-accent)',
      marginBottom: noMargin ? 0 : '18px',
      margin: noMargin ? 0 : undefined,
    }}
  >
    {children}
  </h2>
);

export default SectionLabel;
