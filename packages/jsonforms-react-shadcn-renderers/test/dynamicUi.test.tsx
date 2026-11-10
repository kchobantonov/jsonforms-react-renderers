import { loadDynamicUiExpressions } from '@chobantonov/jsonforms-react-renderer-common/dynamicRuntime';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { afterEach, expect, it } from 'vite-plus/test';
import { DynamicUiProvider } from '@chobantonov/jsonforms-react-renderer-common/DynamicUiProvider';
import { shadcnRenderers, shadcnCells } from '../src';

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
            renderers={shadcnRenderers}
            cells={shadcnCells}
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
