import { JsonForms } from '@jsonforms/react';
import React from 'react';
import { shadcnCells, shadcnRenderers } from '../../src/renderers';
import { schemaForType } from '../../src/complex/MixedRenderer';
import { renderMarkup } from '../render';

describe('Shadcn mixed renderer schemas', () => {
  it('keeps only constraints that apply to the selected type', () => {
    expect(
      schemaForType(
        {
          type: ['array', 'object', 'string'],
          items: { type: 'number' },
          minItems: 2,
          properties: { child: { type: 'string' } },
          required: ['child'],
          minLength: 4,
        },
        'string',
        {}
      )
    ).toEqual({ type: 'string', minLength: 4 });
  });

  it('renders no value control for the null type', () => {
    const markup = renderMarkup(
      React.createElement(JsonForms, {
        cells: shadcnCells,
        data: null,
        renderers: shadcnRenderers,
        schema: { type: ['null', 'string'] },
        uischema: { type: 'Control', scope: '#/' },
      })
    );

    expect(markup).toContain('>null<');
    expect(markup).not.toContain('No applicable renderer found');
    expect(markup).not.toContain('type="text"');
  });
});
