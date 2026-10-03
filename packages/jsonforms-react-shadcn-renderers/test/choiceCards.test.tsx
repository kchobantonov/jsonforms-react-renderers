import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { expect, it, vi } from 'vitest';
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

it.each([
  [undefined, true, 'Registered name'],
  ['GENERATE', true, 'Name'],
  ['generate', true, 'Name'],
  ['REGISTERED', true, 'Registered name'],
  ['DEFAULT', true, 'Registered name'],
  ['GENERATED', true, 'Registered name'],
  ['REGISTERED', false, 'Name'],
  [
    { type: 'Control', scope: '#/properties/name', label: 'Inline name' },
    true,
    'Inline name',
  ],
  [
    {
      elements: [
        { type: 'Control', scope: '#/properties/name', label: 'Inline name' },
      ],
    },
    true,
    'Inline name',
  ],
])(
  'resolves branch detail %j with registry=%s',
  async (detail, registered, label) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const tester = vi.fn((schema: any) =>
      schema.title === 'Person' ? 10 : -1
    );
    const schema = {
      type: 'object',
      definitions: {
        person: {
          type: 'object',
          title: 'Person',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
      },
      properties: {
        selection: {
          oneOf: [
            { $ref: '#/definitions/person' },
            {
              type: 'object',
              properties: { count: { type: 'number' } },
              required: ['count'],
            },
          ],
        },
        sibling: { type: 'string' },
      },
    };
    let value: any;
    try {
      await act(async () =>
        root.render(
          <JsonForms
            schema={schema}
            uischema={{
              type: 'Control',
              scope: '#/properties/selection',
              options: {
                format: 'cards',
                choices: [{ branch: 0, detail }],
              },
            }}
            data={{ selection: { name: 'Ada' }, sibling: 'keep' }}
            uischemas={
              registered
                ? [
                    {
                      tester,
                      uischema: {
                        type: 'Control',
                        scope: '#/properties/name',
                        label: 'Registered name',
                      } as any,
                    },
                  ]
                : []
            }
            renderers={shadcnRenderers}
            cells={shadcnCells}
            onChange={({ data }) => {
              value = data;
            }}
          />
        )
      );
      expect(host.textContent).toContain(label);
      if (label !== 'Registered name')
        expect(host.textContent).not.toContain('Registered name');
      if (registered && label === 'Registered name') {
        expect(tester).toHaveBeenCalledWith(
          schema.definitions.person,
          '#/properties/selection',
          'selection'
        );
      } else if (registered) {
        expect(
          tester.mock.calls.some(([branch]) => branch.title === 'Person')
        ).toBe(false);
      }
      const input = host.querySelector<HTMLInputElement>('input[type="text"]')!;
      expect(input.value).toBe('Ada');
      await act(async () => {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )!.set!.call(input, 'Grace');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });
      expect(value).toEqual({ selection: { name: 'Grace' }, sibling: 'keep' });
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);
