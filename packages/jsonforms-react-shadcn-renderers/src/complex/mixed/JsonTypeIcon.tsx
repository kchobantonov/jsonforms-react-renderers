import React from 'react';

// Keep the shapes in sync with the Svelte renderers' JsonTypeIcon.
export const JsonTypeIcon = ({
  type,
  active = false,
}: {
  type: string;
  active?: boolean;
}) => (
  <svg
    aria-hidden='true'
    data-json-type={type}
    className={`h-4 w-4 shrink-0 fill-none stroke-current ${
      active ? 'text-foreground' : 'text-muted-foreground'
    }`}
    viewBox='0 0 24 24'
    strokeWidth='2.5'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    {type === 'object' && (
      <path d='M8 3c-1.5 0-3 1-3 3v3c0 1.5-1 2-2 2 1 0 2 .5 2 2v3c0 2 1.5 3 3 3M16 3c1.5 0 3 1 3 3v3c0 1.5 1 2 2 2-1 0-2 .5-2 2v3c0 2-1.5 3-3 3' />
    )}
    {type === 'array' && <path d='M8 4H5v16h3M16 4h3v16h-3' />}
    {type === 'string' && <path strokeWidth='2' d='M7 8h10M7 12h10M7 16h6' />}
    {(type === 'number' || type === 'integer') && (
      <g strokeWidth='2'>
        <path d='M9 4v16M15 4v16' />
        <path d='M4 9h16M4 15h16' />
      </g>
    )}
    {type === 'boolean' && <path d='M4 12l5 5L20 7' strokeWidth='3' />}
    {type === 'null' && (
      <g strokeWidth='2'>
        <circle cx='12' cy='12' r='9' />
        <path d='M18.5 5.5l-13 13' />
      </g>
    )}
  </svg>
);
