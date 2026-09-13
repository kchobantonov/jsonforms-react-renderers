import { RuleEffect, UISchemaElement } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createExtendedRenderers } from '@chobantonov/jsonforms-react-extended-renderers';
import { createShadcnExtendedRenderers } from '../src';

const render = (uischema: UISchemaElement, config = {}) => {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(
    <JsonForms
      schema={{}}
      data={{}}
      uischema={uischema}
      config={config}
      renderers={createExtendedRenderers()}
    />
  );
  return container;
};

describe('shared presentation renderers', () => {
  test.each(['Spacer', 'ImageView', 'Separator'])(
    'registers %s with the Svelte rank without matching unrelated elements',
    (type) => {
      for (const entries of [
        createExtendedRenderers(),
        createShadcnExtendedRenderers(),
      ]) {
        const matching = entries.filter(
          (entry) => entry.tester({ type }, {}, undefined) === 1
        );
        expect(matching).toHaveLength(1);
        expect(
          matching[0].tester(
            { type: 'Control', scope: '#' } as UISchemaElement,
            {},
            undefined
          )
        ).toBe(-1);
      }
    }
  );

  test.each([
    [undefined, '32px'],
    [64, '64px'],
    [0, '0px'],
    [-5, '0px'],
    ['64', '32px'],
    [null, '32px'],
    [NaN, '32px'],
    [Infinity, '32px'],
  ])('normalizes spacer height %s to %s', (height, expected) => {
    const spacer = render({ type: 'Spacer', options: { height } })
      .firstElementChild as HTMLElement;
    expect(spacer.style.height).toBe(expected);
    expect(spacer.style.flexShrink).toBe('0');
    expect(spacer.getAttribute('aria-hidden')).toBe('true');
  });

  test('inherits configuration and gives explicit options precedence', () => {
    const config = { height: 48, src: '/default.png', alt: 'Default' };
    expect(
      (render({ type: 'Spacer' }, config).firstElementChild as HTMLElement)
        .style.height
    ).toBe('48px');
    expect(
      (
        render({ type: 'Spacer', options: { height: 16 } }, config)
          .firstElementChild as HTMLElement
      ).style.height
    ).toBe('16px');
    const img = render(
      { type: 'ImageView', options: { alt: 'Override' } },
      config
    ).querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/default.png');
    expect(img.alt).toBe('Override');
    expect(
      render({ type: 'ImageView', options: { src: '' } }, config).querySelector(
        'img'
      )
    ).toBeNull();
    expect(config).toEqual({ height: 48, src: '/default.png', alt: 'Default' });
  });

  test('renders responsive images with alternative text', () => {
    const img = render({
      type: 'ImageView',
      options: { src: '/example.png', alt: 'Example' },
    }).querySelector('img')!;
    expect(img.getAttribute('src')).toBe('/example.png');
    expect(img.alt).toBe('Example');
    expect(img.style.maxWidth).toBe('100%');
    expect(img.style.height).toBe('auto');
    expect(
      render({
        type: 'ImageView',
        options: { src: '/example.png', alt: 12 },
      }).querySelector('img')!.alt
    ).toBe('');
  });

  test.each([undefined, '', null, 42])(
    'omits images with invalid source %s',
    (src) => {
      expect(
        render({ type: 'ImageView', options: { src } }).querySelector('img')
      ).toBeNull();
    }
  );

  test('renders a semantic separator', () => {
    expect(render({ type: 'Separator' }).querySelector('hr')).not.toBeNull();
  });

  test.each(['Spacer', 'ImageView', 'Separator'])(
    'honors visibility rules for %s',
    (type) => {
      expect(
        render({
          type,
          options: { src: '/example.png' },
          rule: {
            effect: RuleEffect.HIDE,
            condition: { scope: '#', schema: {} },
          },
        }).innerHTML
      ).toBe('');
    }
  );
});
