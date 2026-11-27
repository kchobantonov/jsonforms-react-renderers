import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import type {
  JsonFormsRendererRegistryEntry,
  JsonFormsCellRendererRegistryEntry,
} from '@jsonforms/core';
import { describe, expect, it } from 'vite-plus/test';

/** Identical registry-level clearing assertions for each renderer family. */
export function additionalPropertyClearingContract(
  renderers: JsonFormsRendererRegistryEntry[],
  cells: JsonFormsCellRendererRegistryEntry[],
) {
  const settle = async () => {
    // Text debouncing, isolated-form notification and parent notification each
    // cross a React effect boundary. Flush them separately for both families.
    for (let boundary = 0; boundary < 3; boundary++) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 350));
      });
    }
  };
  describe('shared additional-property clearing contract', () => {
    it.each(
      ['customNote', 'note.with.dot', ''].flatMap((key) =>
        ['clear button', 'delete text'].map((operation) => ({
          key,
          operation,
        })),
      ),
    )(
      'preserves "$key" after $operation and removes it only through Delete',
      async ({ key, operation }) => {
        const container = document.createElement('div');
        document.body.append(container);
        const root = createRoot(container);
        let latest: any = { value: { [key]: 'written note' } };
        try {
          await act(async () =>
            root.render(
              <JsonForms
                schema={{
                  type: 'object',
                  properties: {
                    value: {
                      type: 'object',
                      additionalProperties: {
                        type: 'string',
                        default: 'default note',
                      },
                    },
                  },
                }}
                data={latest}
                uischema={{
                  type: 'Control',
                  scope: '#/properties/value',
                  options: { confirmation: { delete: 'never' } },
                }}
                renderers={renderers}
                cells={cells}
                onChange={(event) => {
                  latest = event.data;
                }}
              />,
            ),
          );
          const input = container.querySelector<HTMLInputElement>(
            '.jsonforms-additional-property-control input',
          )!;
          expect(input).not.toBeNull();
          if (operation === 'clear button') {
            await act(async () =>
              container
                .querySelector<HTMLButtonElement>(
                  '.jsonforms-additional-property-control button[aria-label="Clear value"]',
                )!
                .click(),
            );
          } else {
            await act(async () => {
              Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value',
              )!.set!.call(input, '');
              input.dispatchEvent(new Event('input', { bubbles: true }));
            });
          }
          await settle();
          expect(latest.value).toEqual({ [key]: '' });
          expect(JSON.parse(JSON.stringify(latest.value))).toEqual({
            [key]: '',
          });
          expect(
            container.querySelector(
              '.jsonforms-additional-property-control input',
            ),
          ).toBe(input);
          expect(input.value).toBe('');
          await act(async () =>
            container
              .querySelector<HTMLButtonElement>(`[aria-label="Delete ${key}"]`)!
              .click(),
          );
          await settle();
          expect(latest.value).toEqual({});
          expect(
            container.querySelector('.jsonforms-additional-property-control'),
          ).toBeNull();
        } finally {
          await act(async () => root.unmount());
          container.remove();
        }
      },
    );
  });
}
