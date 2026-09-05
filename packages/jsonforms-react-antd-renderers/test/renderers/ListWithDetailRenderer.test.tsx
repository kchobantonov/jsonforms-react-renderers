import { JsonForms } from '@jsonforms/react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { antdRenderers, listWithDetailTester } from '../../src';
import { runRendererContract } from './rendererContract';

runRendererContract('ListWithDetailRenderer', listWithDetailTester);

describe('ListWithDetailRenderer primitive arrays', () => {
  const uischema = {
    type: 'ListWithDetail',
    scope: '#/properties/values',
  };

  it('claims primitive arrays', () => {
    expect(
      listWithDetailTester(
        uischema,
        {
          type: 'object',
          properties: {
            values: { type: 'array', items: { type: 'number' } },
          },
        },
        undefined
      )
    ).toBe(4);
  });

  it('renders primitive array items without a missing renderer', () => {
    const html = renderToStaticMarkup(
      <JsonForms
        data={{ values: [1, 2, 3] }}
        schema={{
          type: 'object',
          properties: {
            values: { type: 'array', items: { type: 'number' } },
          },
        }}
        uischema={uischema}
        renderers={antdRenderers}
      />
    );

    expect(html).toContain('Values');
    expect(html).not.toContain('No applicable renderer found');
  });
});
