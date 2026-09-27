import { LayoutProps, RankedTester, rankWith, uiTypeIs } from '@jsonforms/core';
import { withJsonFormsLayoutProps } from '@jsonforms/react';
import React from 'react';

export const separatorRendererTester: RankedTester = rankWith(
  1,
  uiTypeIs('Separator')
);

/**
 * `Separator` - a static divider that reads and writes nothing.
 *
 * `options.vertical` is section 13's single orientation encoding, the same
 * convention `vertical` follows everywhere else in this project. An `<hr>` has
 * an implicit `separator` role whose default orientation is horizontal, so a
 * vertical one has to say so: `aria-orientation` is what tells a screen reader
 * the sections are side by side rather than stacked.
 *
 * The extent comes from the layout, as the specification requires - a vertical
 * separator needs usable height from its context, and supplies none itself.
 */
export const SeparatorRendererComponent = ({
  uischema,
  visible,
}: LayoutProps) => {
  if (visible === false) {
    return null;
  }
  const vertical =
    (uischema as { options?: Record<string, unknown> }).options?.vertical ===
    true;
  return vertical ? (
    <hr
      aria-orientation='vertical'
      data-separator='vertical'
      style={{
        // `height: 100%` alone collapses in a flex row, where the default
        // `align-self: stretch` is what actually gives the rule its extent.
        alignSelf: 'stretch',
        width: 0,
        height: 'auto',
        margin: 0,
        borderLeft: '1px solid currentColor',
        borderTop: 0,
        opacity: 0.3,
      }}
    />
  ) : (
    <hr aria-orientation='horizontal' data-separator='horizontal' />
  );
};

export const SeparatorRenderer = withJsonFormsLayoutProps(
  SeparatorRendererComponent
);
