import ExclamationCircleFilled from '@ant-design/icons/ExclamationCircleFilled';
import { Tooltip, theme as antTheme } from 'antd';
import React from 'react';

/**
 * A marker on a container's header.
 *
 * Both markers are **SVG**, not text glyphs and not CSS shapes. A glyph like
 * `●` renders at whatever size and baseline the platform font gives it, so it
 * never lines up with an icon beside it; a CSS circle is crisp but is a third
 * mechanism to keep in sync. An SVG in antd's own icon box - `1em` square,
 * `currentColor`, `viewBox="64 64 896 896"` - is resolution independent, takes
 * its size from `fontSize` and its color from `color`, so two markers sharing
 * this shell are aligned and sized identically by construction.
 *
 * The shell must not make its header taller. It uses the body font size, which
 * is smaller than the header's line box, and `lineHeight: 0` so the inline box
 * adds no leading of its own.
 */
export interface ContainerIndicatorProps {
  /** Tooltip text and accessible name. One string, so they cannot diverge. */
  label: string;
  /** `colorError` for a failure, a muted color for data presence. */
  color: string;
  children: React.ReactNode;
  /** Marks the element for tests and host styling. */
  marker?: Record<string, boolean | number | string | undefined>;
}

export const ContainerIndicator = ({
  label,
  color,
  children,
  marker,
}: ContainerIndicatorProps) => {
  const { token } = antTheme.useToken();
  return (
    <Tooltip title={label} trigger={['hover', 'focus']}>
      <span
        role='img'
        aria-label={label}
        tabIndex={0}
        {...marker}
        style={{
          color,
          display: 'inline-flex',
          alignItems: 'center',
          // Body size, not the header's: large enough to read, never tall
          // enough to stretch the row.
          fontSize: token.fontSize,
          lineHeight: 0,
        }}
      >
        {children}
      </span>
    </Tooltip>
  );
};

/**
 * A plain filled dot in antd's icon box.
 *
 * `@ant-design/icons` has no plain circle - every `*CircleFilled` carries a
 * symbol - so this draws one, matching the box and attributes of the icons it
 * sits beside. Deliberately smaller than a full icon: data presence is a
 * quieter signal than a failure.
 */
export const DataDotIcon = () => (
  <svg
    viewBox='64 64 896 896'
    width='1em'
    height='1em'
    fill='currentColor'
    focusable='false'
    aria-hidden='true'
  >
    <circle cx='512' cy='512' r='224' />
  </svg>
);

/** The failure marker: antd's own filled exclamation. */
export const ErrorIcon = () => <ExclamationCircleFilled rev={undefined} />;
