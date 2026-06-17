import React from 'react';

const GENRE_COLORS: Record<string, string> = {
  Action: '#E53935',
  Adventure: '#3b9c40',
  Animation: '#8E24AA',
  Comedy: '#FDD835',
  Crime: '#4527A0',
  Documentary: '#00897B',
  Drama: '#6D4C41',
  Family: '#42A5F5',
  Fantasy: '#9C27B0',
  History: '#A1887F',
  Horror: '#7F0000',
  Music: '#D81B60',
  Mystery: '#283593',
  Romance: '#EC407A',
  'Science Fiction': '#00ACC1',
  Thriller: '#EF6C00',
  War: '#556B2F',
  Western: '#8D6E63',
};

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

const GenrePill: React.FC<{ genre: string }> = ({ genre }) => {
  const hex = GENRE_COLORS[genre] ?? '#888888';
  const rgb = hexToRgb(hex);
  const textColor = lighten(hex, 0.35);

  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 'var(--text-xs)',
        fontWeight: 'var(--weight-medium)' as React.CSSProperties['fontWeight'],
        color: textColor,
        background: `rgba(${rgb},0.12)`,
        border: `1px solid rgba(${rgb},0.4)`,
        borderRadius: 'var(--radius-pill)',
        padding: '2px 8px',
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
      }}
    >
      {genre}
    </span>
  );
};

export default GenrePill;
