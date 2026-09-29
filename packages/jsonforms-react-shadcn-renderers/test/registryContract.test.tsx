import React from 'react';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers, ShadcnOneOfEnumControl } from '../src';
import { renderMarkup } from './render';

it('renders controls inside categories', () => {
  const markup = renderMarkup(
    <JsonForms
      schema={{ type: 'object', properties: { name: { type: 'string' } } }}
      data={{ name: 'Ada' }}
      renderers={shadcnRenderers}
      uischema={
        {
          type: 'Categorization',
          elements: [
            {
              type: 'Category',
              label: 'Details',
              elements: [{ type: 'Control', scope: '#/properties/name' }],
            },
          ],
        } as any
      }
    />
  );
  expect(markup).toContain('value="Ada"');
  expect(markup).not.toContain('No applicable renderer');
});

it('prefers a select for oneOf const choices', () => {
  const schema = {
    type: 'number',
    oneOf: [
      { const: 1, title: 'One' },
      { const: 2, title: 'Two' },
    ],
  } as any;
  const uischema = { type: 'Control', scope: '#' };
  const ranked = shadcnRenderers
    .map((entry) => ({
      ...entry,
      rank: entry.tester(uischema, schema, { rootSchema: schema, config: {} }),
    }))
    .sort((a, b) => b.rank - a.rank);
  expect(ranked[0].renderer).toBe(ShadcnOneOfEnumControl);
});
