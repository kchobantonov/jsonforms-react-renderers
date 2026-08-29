import {
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  rankWith,
} from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  MixedRenderer,
  mixedControlTester,
} from '../../src/complex/MixedRenderer';

const schema: JsonSchema = {
  type: ['object', 'array', 'string'],
  additionalProperties: true,
  items: { type: 'string' },
};
const renderers: JsonFormsRendererRegistryEntry[] = [
  { tester: mixedControlTester, renderer: MixedRenderer },
  { tester: rankWith(1, () => true), renderer: () => <div /> },
];

const renderMixedValue = (data: unknown) =>
  renderToStaticMarkup(
    <JsonForms
      data={data}
      schema={schema}
      uischema={{ type: 'Control', scope: '#' }}
      renderers={renderers}
    />
  );

describe('MixedRenderer', () => {
  it.each([
    ['object', {}],
    ['array', []],
  ])('renders the %s detail panel open by default', (_type, data) => {
    const html = renderMixedValue(data);

    expect(html).toContain(
      '<details class="jsonforms-mixed-renderer-detail" open="">'
    );
  });

  it('does not wrap primitive values in a detail panel', () => {
    expect(renderMixedValue('value')).not.toContain(
      'jsonforms-mixed-renderer-detail'
    );
  });
});
