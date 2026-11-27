import React from 'react';
import { createMarkupLabelRenderer } from '@chobantonov/jsonforms-react-extended-renderers';

/** Block markup needs a block wrapper; inline labels keep inline semantics. */
export const ShadcnMarkupLabelRenderer = createMarkupLabelRenderer(
  ({ block, children }) => {
    const Component = block ? 'div' : 'span';
    return (
      <Component
        data-markup-typography
        className='text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6'
      >
        {children}
      </Component>
    );
  },
);
