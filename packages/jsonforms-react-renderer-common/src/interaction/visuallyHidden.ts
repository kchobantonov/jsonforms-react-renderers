import { CSSProperties } from 'react';

/**
 * Hides content visually while leaving it available to assistive technology.
 *
 * Inline rather than a `sr-only` class: that class is defined in the demo
 * application's stylesheet, not in this package, so a renderer relying on it
 * shows the text to everyone in any other host.
 */
export const visuallyHidden: CSSProperties = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
};
