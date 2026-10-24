import { useState } from 'react';

/**
 * Gates an input's clear button so it only appears when there is something to
 * clear *and* the control is hovered or focused. antd's own `allowClear` shows
 * the icon whenever a value is present, which leaves a permanent × on every
 * populated field - noisy in a form and worse in a dense table row.
 */
export const useClearAffordance = (hasValue: boolean) => {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return {
    allowClear: hasValue && (hovered || focused),
    affordanceProps: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      // hovering away while focused must not hide it, hence two flags
      onFocus: () => setFocused(true),
      onBlur: () => setFocused(false),
    },
  };
};
