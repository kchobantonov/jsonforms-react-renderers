import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { expect, it } from 'vitest';
import { shadcnRenderers, shadcnCells } from '../src';

it('selects typed cards, translates labels and swaps selected content', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let value: unknown;
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={{
            type: 'object',
            properties: { selection: { enum: [false, 1, 2] } },
          }}
          uischema={{
            type: 'Control',
            scope: '#/properties/selection',
            options: {
              format: 'cards',
              choices: [
                { value: false, label: 'Off', i18n: 'off' },
                {
                  value: 1,
                  label: 'One',
                  content: { type: 'Label', text: 'Idle' },
                  selectedContent: { type: 'Label', text: 'Selected' },
                },
                { value: 2, label: 'Two', disabled: true },
              ],
            },
          }}
          data={{ selection: false }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
          i18n={{
            locale: 'bg',
            translate: (key, fallback) =>
              key === 'off.label' ? 'Изключено' : fallback,
          }}
          onChange={({ data }) => {
            value = data.selection;
          }}
        />
      )
    );
    expect(host.querySelector('[aria-label="Изключено"]')).not.toBeNull();
    const radios = host.querySelectorAll<HTMLInputElement>('input[type=radio]');
    expect(radios[0].checked).toBe(true);
    expect(radios[0].style.clipPath).toBe('inset(50%)');
    act(() => radios[0].focus());
    expect(
      radios[0].closest<HTMLElement>('.jsonforms-choice-card')?.style.outline
    ).toContain('2px');
    expect(radios[2].disabled).toBe(true);
    act(() => {
      radios[1]
        .closest('.jsonforms-choice-card')!
        .dispatchEvent(new Event('pointerdown', { bubbles: true }));
      radios[1].focus();
    });
    expect(
      radios[1].closest<HTMLElement>('.jsonforms-choice-card')!.style.outline
    ).toBe('');
    await act(async () => radios[1].click());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(value).toBe(1);
    expect(host.textContent).toContain('Selected');
    expect(host.textContent).not.toContain('Idle');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
it.each([false, true])(
  'switches branches and preserves enclosing properties (discriminator only=%s)',
  async (discriminatorOnly) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    let value: any;
    try {
      await act(async () =>
        root.render(
          <JsonForms
            schema={{
              type: 'object',
              properties: { shared: { type: 'string' } },
              oneOf: [
                {
                  title: 'Email',
                  properties: {
                    kind: { const: 'email', default: 'email' },
                    email: { type: 'string' },
                  },
                  required: ['email'],
                },
                {
                  title: 'Post',
                  properties: {
                    kind: { const: 'post', default: 'post' },
                    street: { type: 'string' },
                  },
                  required: ['street'],
                },
              ],
            }}
            uischema={{
              type: 'Control',
              scope: '#',
              options: {
                format: 'cards',
                showRadio: true,
                confirmation: {
                  branchChange: discriminatorOnly ? 'complex' : 'never',
                },
                choices: [
                  {
                    branch: 1,
                    detail: {
                      type: 'VerticalLayout',
                      elements: [
                        {
                          type: 'Control',
                          scope: '#/properties/street',
                          label: 'Street address',
                        },
                      ],
                    },
                  },
                ],
              },
            }}
            config={{
              jsonformsExtended: { confirmation: { default: 'never' } },
            }}
            data={
              discriminatorOnly
                ? { shared: 'keep', kind: 'email' }
                : { shared: 'keep', kind: 'email', email: 'a' }
            }
            renderers={shadcnRenderers}
            cells={shadcnCells}
            onChange={({ data }) => {
              value = data;
            }}
          />
        )
      );
      await act(async () =>
        (host.querySelector('[aria-label="Post"]') as HTMLElement).click()
      );
      expect(host.textContent).toContain('Street address');
      expect(
        (host.querySelector('[aria-label="Post"]') as HTMLInputElement).style
          .clipPath
      ).toBe('');
      expect(
        (host.querySelector('[aria-label="Post"]') as HTMLInputElement).checked
      ).toBe(true);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
      });
      expect(value.shared).toBe('keep');
      expect(value.kind).toBe('post');
      expect(value.email).toBeUndefined();
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);
