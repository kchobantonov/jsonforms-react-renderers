import { JsonForms } from '@jsonforms/react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { antdRenderers, arrayLayoutTester } from '../../src';
import { runRendererContract } from './rendererContract';

runRendererContract('ArrayLayout', arrayLayoutTester);

describe('ArrayLayout unrestricted items', () => {
  it('handles arrays such as JSON Schema examples with items true', () => {
    expect(
      arrayLayoutTester(
        { type: 'Control', scope: '#' },
        { type: 'array', items: true },
        undefined
      )
    ).toBe(4);
  });

  it('renders the JSON Schema examples field instead of a missing renderer', () => {
    const html = renderToStaticMarkup(
      <JsonForms
        data={{ readOnly: false, writeOnly: false, examples: [] }}
        schema={{
          type: 'object',
          properties: {
            readOnly: { type: 'boolean' },
            writeOnly: { type: 'boolean' },
            examples: { type: 'array', items: true },
          },
        }}
        renderers={antdRenderers}
      />
    );

    expect(html).toContain('Examples');
    expect(html).not.toContain('No applicable renderer found');
  });
});
