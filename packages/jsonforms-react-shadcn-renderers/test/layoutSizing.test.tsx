import React from 'react';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers } from '../src';
import { renderMarkup } from './render';

const render = (options: any, childOptions: any = {}, config: any = {}) => {
  const html = renderMarkup(
    <JsonForms
      schema={{ type: 'object', properties: { name: { type: 'string' } } }}
      data={{ name: 'Ada' }}
      config={config}
      renderers={shadcnRenderers}
      uischema={
        {
          type: 'HorizontalLayout',
          options,
          elements: [
            {
              type: 'Control',
              scope: '#/properties/name',
              options: { layout: childOptions },
            },
          ],
        } as any
      }
    />
  );
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.querySelector<HTMLElement>('[data-layout="row"]')!;
};

it.each([0, 8, 24])('uses the configured gap %s', (gap) =>
  expect(render({ gap }).style.gap).toBe(`${gap}px`)
);
it.each([true, false])('honors wrap %s', (wrap) =>
  expect(render({ wrap }).style.flexWrap).toBe(wrap ? 'wrap' : 'nowrap')
);
it.each([
  ['start', 'flex-start'],
  ['center', 'center'],
  ['end', 'flex-end'],
  ['stretch', 'stretch'],
])('aligns %s', (align, expected) =>
  expect(render({ align }).style.alignItems).toBe(expected)
);
it('uses the global layout gap', () =>
  expect(
    render({}, {}, { jsonformsExtended: { layoutDefaults: { gap: 12 } } }).style
      .gap
  ).toBe('12px'));
it('sizes fixed children', () =>
  expect(
    (render({}, { width: 240 }).firstElementChild as HTMLElement).style
      .flexBasis
  ).toBe('240px'));
it('sizes weighted children', () =>
  expect(
    (render({}, { weight: 2 }).firstElementChild as HTMLElement).style.flexGrow
  ).toBe('2'));
