import { loadDynamicUiExpressions } from '@chobantonov/jsonforms-react-renderer-common/dynamicRuntime';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { afterEach, expect, it } from 'vite-plus/test';
import { DynamicUiProvider } from '@chobantonov/jsonforms-react-renderer-common/DynamicUiProvider';
import { antdRenderers, antdCells } from '../src';

let dispose = () => {};
afterEach(() => dispose());
it('supports dynamic selection and parent category labels through the published registries', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  dispose = () => {
    act(() => root.unmount());
    host.remove();
  };
  const schema = {
    type: 'object',
    properties: {
      plan: { type: 'string', enum: ['basic', 'pro'] },
      name: { type: 'string' },
    },
  };
  const uischema = {
    type: 'Categorization',
    elements: [
      {
        type: 'Category',
        label: 'Static',
        $dynamic: { label: { bind: 'external.category' } },
        elements: [
          { type: 'Control', scope: '#/properties/name', label: 'Name' },
          {
            type: 'Control',
            scope: '#/properties/plan',
            label: 'Plan',
            $dynamic: [
              {
                when: { expression: 'external.radio' },
                overlay: { options: { format: 'radio' } },
              },
            ],
          },
        ],
      },
    ],
  };
  const update = async (radio: boolean, category: string) => {
    await act(async () =>
      root.render(
        <DynamicUiProvider
          config={{ jsonformsExtended: { dynamic: { enabled: true } } }}
          external={{ radio, category }}
        >
          <JsonForms
            data={{ plan: 'pro', name: 'Ada' }}
            schema={schema}
            uischema={uischema}
            renderers={antdRenderers}
            cells={antdCells}
          />
        </DynamicUiProvider>,
      ),
    );
  };
  await update(false, 'First category');
  await act(loadDynamicUiExpressions);
  expect(host.textContent).toContain('First category');
  const name = host.querySelector('input[value="Ada"]');
  expect(name).not.toBeNull();
  await update(true, 'Renamed category');
  expect(host.textContent).toContain('Renamed category');
  expect(
    host.querySelectorAll('input[type="radio"],[role="radio"]').length,
  ).toBeGreaterThanOrEqual(2);
  expect(host.querySelector('input[value="Ada"]')).toBe(name);
  await update(false, 'First category');
  await act(loadDynamicUiExpressions);
  expect(
    host.querySelectorAll('input[type="radio"],[role="radio"]'),
  ).toHaveLength(0);
  expect(host.querySelector('input[value="Ada"]')).toBe(name);
});

it('updates Group region children and accessible name without remounting the body', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  dispose = () => {
    act(() => root.unmount());
    host.remove();
  };
  const uischema = {
    type: 'Group',
    label: 'Fallback',
    cover: {
      type: 'Label',
      text: 'Initial cover',
      $dynamic: { text: { bind: 'external.cover' } },
    },
    header: [
      {
        type: 'Label',
        text: 'Initial',
        $dynamic: { text: { bind: 'external.title' } },
      },
    ],
    elements: [{ type: 'Control', scope: '#/properties/name' }],
    footer: [
      {
        type: 'Label',
        text: 'Initial footer',
        $dynamic: { text: { bind: 'external.footer' } },
      },
    ],
  };
  const update = async (title: string, cover: string, footer: string) => {
    await act(async () =>
      root.render(
        <DynamicUiProvider
          config={{ jsonformsExtended: { dynamic: { enabled: true } } }}
          external={{ title, cover, footer }}
        >
          <JsonForms
            data={{ name: 'Ada' }}
            schema={{
              type: 'object',
              properties: { name: { type: 'string' } },
            }}
            uischema={uischema}
            renderers={antdRenderers}
            cells={antdCells}
          />
        </DynamicUiProvider>,
      ),
    );
  };
  await update('First title', 'First cover', 'First footer');
  const frame = host.querySelector('[data-group-frame]');
  expect(frame?.getAttribute('aria-label')).toBe('First title');
  const input = host.querySelector('input[value="Ada"]');
  expect(input).not.toBeNull();
  await update('Second title', 'Second cover', 'Second footer');
  expect(frame?.getAttribute('aria-label')).toBe('Second title');
  expect(host.querySelector('[data-group-cover]')?.textContent).toContain(
    'Second cover',
  );
  expect(host.querySelector('[data-group-footer]')?.textContent).toContain(
    'Second footer',
  );
  expect(host.querySelector('input[value="Ada"]')).toBe(input);
});
