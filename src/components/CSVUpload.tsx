import React, { useEffect, useRef, useState } from 'react';

import type { Movie } from '../types';
import { normalizeMovies, parseCSV } from '../utils';

type Props = {
  movieCount: number;
  isEnriching: boolean;
  progress: { completed: number; total: number } | null;
  enrichmentTime: number | null;
  onMoviesLoaded: (movies: Movie[]) => void;
  onExport?: () => void;
  onError: (error: string) => void;
};

const ENRICHING_MESSAGES = [
  "Sit back and relax - we're gathering info on your watchlist...",
  'Good taste detected! Fetching all the details...',
  "Hold tight! We're looking up your movies...",
  'Consulting the cinema archives...',
  'Great watchlist! Give us a moment to look everything up...',
];

const EXPORT_GUIDES = [
  {
    source: 'IMDb',
    link: 'https://www.imdb.com/watchlist/',
    steps: [
      'Click `Export` near the top-right corner of the page.',
      'If prompted, open the exports page and download the CSV from there.',
      'Upload the downloaded CSV file here.',
    ],
  },
  {
    source: 'Letterboxd',
    link: 'https://letterboxd.com/watchlist/',
    steps: [
      'Click `Export Watchlist` top-right next to the movie list.',
      'Upload the downloaded CSV file here.',
    ],
  },
];

const ExportGuide: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: '12px' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          margin: '0 auto',
          background: 'transparent',
          border: 'none',
          color: open ? 'var(--color-text)' : 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
          fontWeight:
            'var(--weight-medium)' as React.CSSProperties['fontWeight'],
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.color = 'var(--color-text)')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = open
            ? 'var(--color-text)'
            : 'var(--color-text-secondary)')
        }
      >
        <span
          style={{
            display: 'inline-block',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            fontSize: 'var(--text-xs)',
          }}
        >
          ▶
        </span>
        How do I get my watchlist file?
      </button>

      {open && (
        <div style={{ marginTop: '14px', paddingBottom: '24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            {EXPORT_GUIDES.map(({ source, link, steps }) => (
              <div
                key={source}
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight:
                      'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-accent)',
                    textAlign: 'center',
                    marginBottom: '3px',
                  }}
                >
                  {source}
                </p>
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    fontSize: 'var(--text-xs)',
                    fontWeight:
                      'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                    color: 'var(--color-accent)',
                    opacity: 0.7,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                    marginBottom: '12px',
                  }}
                >
                  Open your watchlist ↗
                </a>

                <ol
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {steps.map((step, i) => (
                    <li
                      key={i}
                      style={{
                        display: 'flex',
                        gap: '7px',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--color-accent)',
                          flexShrink: 0,
                          fontWeight:
                            'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                        }}
                      >
                        {i + 1}.
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                marginBottom: '10px',
              }}
            >
              As the most popular options, IMDb and Letterboxd are fully
              supported out of the box.
            </p>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
              }}
            >
              But don't worry! Any CSV with a 'Title' and 'Year' columns will
              work - Trakt, MovieBase, a personal spreadsheet, or whatever else
              you use to keep track of your lists.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const CSVUpload: React.FC<Props> = ({
  movieCount,
  isEnriching,
  progress,
  enrichmentTime,
  onMoviesLoaded,
  onExport,
  onError,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [smoothPct, setSmoothPct] = useState(0);
  const targetPctRef = useRef(0);

  useEffect(() => {
    targetPctRef.current = progress
      ? (progress.completed / progress.total) * 100
      : 0;
  }, [progress]);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      setSmoothPct((prev) => {
        const target = targetPctRef.current;
        const delta = target - prev;
        if (Math.abs(delta) < 0.05) return target;
        return prev + delta * 0.1;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      onError('Please upload a .csv file.');
      return;
    }
    setIsParsing(true);
    const result = await parseCSV(file);
    setIsParsing(false);
    if (!result.success) {
      onError(result.error);
      return;
    }
    const movies = normalizeMovies(result.rows);
    if (movies.length === 0) {
      onError('No valid movies found in the CSV file.');
      return;
    }
    onMoviesLoaded(movies);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node))
      setIsDragging(false);
  };

  const cardStyle: React.CSSProperties = {
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
  };

  // Parsing
  if (isParsing) {
    return (
      <div
        style={{
          ...cardStyle,
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <svg
          className="animate-spin"
          style={{
            width: 20,
            height: 20,
            color: 'var(--color-accent)',
            flexShrink: 0,
          }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeOpacity="0.25"
          />
          <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <div>
          <p
            style={{
              fontSize: 'var(--text-md)',
              fontWeight:
                'var(--weight-medium)' as React.CSSProperties['fontWeight'],
              color: 'var(--color-text)',
            }}
          >
            Reading your file…
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
              marginTop: '2px',
            }}
          >
            Parsing your watchlist
          </p>
        </div>
      </div>
    );
  }

  // Enriching
  if (isEnriching && progress) {
    const msg = ENRICHING_MESSAGES[progress.total % ENRICHING_MESSAGES.length];
    return (
      <div style={{ ...cardStyle, padding: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '14px',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--color-text-secondary)',
              fontWeight:
                'var(--weight-medium)' as React.CSSProperties['fontWeight'],
            }}
          >
            {msg}
          </p>
          <p
            style={{
              fontSize: 'var(--text-base)',
              fontWeight:
                'var(--weight-bold)' as React.CSSProperties['fontWeight'],
              color: 'var(--color-accent)',
              whiteSpace: 'nowrap',
            }}
          >
            {progress.completed} / {progress.total}
          </p>
        </div>
        <div
          style={{
            height: '6px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${smoothPct}%`,
              borderRadius: 'var(--radius-sm)',
              background:
                'linear-gradient(to right, var(--color-accent), var(--color-accent-hover))',
            }}
          />
        </div>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-muted)',
            marginTop: '8px',
            fontWeight:
              'var(--weight-medium)' as React.CSSProperties['fontWeight'],
          }}
        >
          {Math.round(smoothPct)}% complete
        </p>
      </div>
    );
  }

  // Loaded
  if (movieCount > 0) {
    return (
      <div>
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            ...cardStyle,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--color-accent-subtle)',
                border: '1px solid rgba(255,128,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent)',
                fontSize: 'var(--text-md)',
                flexShrink: 0,
              }}
            >
              ✓
            </div>
            <div>
              <p
                style={{
                  fontSize: 'var(--text-md)',
                  fontWeight:
                    'var(--weight-bold)' as React.CSSProperties['fontWeight'],
                  color: 'var(--color-text)',
                }}
              >
                Watchlist Loaded
              </p>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  marginTop: '2px',
                  fontWeight:
                    'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                }}
              >
                {movieCount} Movies
                {enrichmentTime != null
                  ? ` · enriched in ${enrichmentTime.toFixed(1)}s`
                  : ''}
              </p>
            </div>
          </div>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-muted)',
              fontWeight:
                'var(--weight-medium)' as React.CSSProperties['fontWeight'],
              flexShrink: 0,
            }}
          >
            Click to Replace
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {onExport && (
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button
              onClick={onExport}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '4px 8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: 'var(--text-sm)',
                fontWeight:
                  'var(--weight-medium)' as React.CSSProperties['fontWeight'],
                fontFamily: 'var(--font-body)',
                color: 'var(--color-muted)',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = 'var(--color-text-secondary)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'var(--color-muted)')
              }
            >
              <span style={{ fontSize: 'var(--text-xs)' }}>↓</span>
              Download Current List
            </button>
          </div>
        )}
      </div>
    );
  }

  // Empty dropzone
  return (
    <>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          borderRadius: 'var(--radius-lg)',
          border: `2px dashed ${isDragging ? 'var(--color-accent)' : 'var(--color-border)'}`,
          background: isDragging
            ? 'var(--color-accent-subtle)'
            : 'var(--color-surface)',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 0.2s ease, background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isDragging)
            e.currentTarget.style.borderColor = 'var(--color-border-light)';
        }}
        onMouseLeave={(e) => {
          if (!isDragging)
            e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
      >
        <div
          style={{
            fontSize: 'var(--text-display)',
            marginBottom: '16px',
            filter: isDragging ? 'none' : 'grayscale(1)',
            opacity: isDragging ? 1 : 0.5,
            transform: isDragging ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.2s',
          }}
        >
          {isDragging ? '📂' : '📁'}
        </div>
        <p
          style={{
            fontSize: 'var(--text-md)',
            fontWeight:
              'var(--weight-bold)' as React.CSSProperties['fontWeight'],
            color: 'var(--color-text)',
            marginBottom: '6px',
          }}
        >
          Drop your watchlist CSV here
        </p>
        <p
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-text-secondary)',
            fontWeight:
              'var(--weight-medium)' as React.CSSProperties['fontWeight'],
          }}
        >
          ...or click to browse
        </p>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-muted)',
            marginTop: '8px',
            fontWeight:
              'var(--weight-medium)' as React.CSSProperties['fontWeight'],
          }}
        >
          We support both IMDb and Letterboxd exports!
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <ExportGuide />
    </>
  );
};

export default CSVUpload;
