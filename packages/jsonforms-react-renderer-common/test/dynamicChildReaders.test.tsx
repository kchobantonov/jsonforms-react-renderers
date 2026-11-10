import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vite-plus/test';
import {
  JsonFormsDispatch,
  withJsonFormsLayoutProps,
  withJsonFormsControlProps,
} from '@jsonforms/react';
import {
  DynamicJsonForms,
  useDynamicTreeResolver,
} from '../src/DynamicUiProvider';
import { loadDynamicUiExpressions } from '../src/dynamicRuntime';
import { useContainerValidation } from '../src/validationIndicator';
import { conditionalLayout } from '../src/conditionalFields';

const Field = withJsonFormsControlProps((props: any) => (
  <input aria-label={props.label} value={props.data ?? ''} readOnly />
));
const Reader = withJsonFormsLayoutProps((props: any) => {
  const resolve = useDynamicTreeResolver(props.path);
  const ui = resolve(props.uischema);
  const indicator = useContainerValidation(
    props.uischema,
    props.path,
    props.config,
    true,
  );
  const filtered = conditionalLayout(
    ui,
    { properties: { b: { type: 'string' } } },
    new Set(['a', 'b']),
  ) as any;
  return (
    <div data-count={indicator.count}>
      {filtered.elements.map((child: any, index: number) => (
        <JsonFormsDispatch {...props} key={index} uischema={child} />
      ))}
    </div>
  );
});
const renderers = [
  { tester: (ui: any) => (ui.type === 'Group' ? 2 : -1), renderer: Reader },
  { tester: () => 1, renderer: Field },
];
it('filters and counts resolved child scopes before dispatch and updates after external changes', async () => {
  await loadDynamicUiExpressions();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const props = {
    schema: {
      type: 'object',
      properties: { b: { type: 'string', minLength: 2 } },
    },
    data: { b: '' },
    uischema: {
      type: 'Group',
      options: { showValidationIndicatorCount: true },
      elements: [
        {
          type: 'Control',
          scope: '#/properties/a',
          $dynamic: {
            scope: { bind: 'external.scope' },
            label: { bind: 'external.label' },
          },
        },
      ],
    },
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    renderers,
  };
  try {
    await act(async () =>
      root.render(
        <DynamicJsonForms
          {...props}
          external={{ scope: '#/properties/b', label: 'Effective' }}
        />,
      ),
    );
    expect(host.querySelector('input')?.getAttribute('aria-label')).toBe(
      'Effective',
    );
    expect(host.querySelector('[data-count]')?.getAttribute('data-count')).toBe(
      '1',
    );
    const input = host.querySelector('input');
    await act(async () =>
      root.render(
        <DynamicJsonForms
          {...props}
          external={{ scope: '#/properties/b', label: 'Changed' }}
        />,
      ),
    );
    expect(host.querySelector('input')).toBe(input);
    expect(input?.getAttribute('aria-label')).toBe('Changed');
    await act(async () =>
      root.render(
        <DynamicJsonForms
          {...props}
          external={{ scope: '#/properties/a', label: 'Gone' }}
        />,
      ),
    );
    expect(host.querySelector('input')).toBeNull();
    expect(host.querySelector('[data-count]')?.getAttribute('data-count')).toBe(
      '0',
    );
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

it('selects parent renderers using dynamic descendant types and preserves drafts until replacement', async () => {
  await loadDynamicUiExpressions();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const Parent = (props: any) => (
    <div data-parent-label={props.uischema.elements[0].label}>
      <input aria-label='Parent draft' defaultValue='' />
    </div>
  );
  const Other = () => <button data-other>Other editor</button>;
  const props = {
    data: {},
    schema: { type: 'object' },
    uischema: {
      type: 'Categorization',
      elements: [
        {
          type: 'Category',
          label: 'Static',
          $dynamic: {
            type: { bind: 'external.type' },
            label: { bind: 'external.label' },
          },
        },
      ],
    },
    renderers: [
      {
        tester: (ui: any) =>
          ui.type === 'Categorization' &&
          ui.elements.every((child: any) => child.type === 'Category')
            ? 10
            : -1,
        renderer: Parent,
      },
      { tester: () => 1, renderer: Other },
    ],
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
  };
  const update = async (type: string, label: string, enabled = true) => {
    await act(async () =>
      root.render(
        <DynamicJsonForms
          {...props}
          external={{ type, label }}
          config={{ jsonformsExtended: { dynamic: { enabled } } }}
        />,
      ),
    );
  };
  try {
    await update('Category', 'First', false);
    const input = host.querySelector('input')!;
    input.value = 'draft';
    input.focus();
    await update('Category', 'First');
    expect(host.querySelector('input')).toBe(input);
    expect(
      host
        .querySelector('[data-parent-label]')
        ?.getAttribute('data-parent-label'),
    ).toBe('First');
    await update('Category', 'Updated');
    expect(host.querySelector('input')).toBe(input);
    expect(input.value).toBe('draft');
    await update('Control', 'Changed type');
    expect(input.isConnected).toBe(false);
    expect(document.activeElement).toBe(host.querySelector('button'));
    await update('Category', 'Restored');
    expect(host.querySelector('input')?.value).toBe('');
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});

it('selects parents independently for reused row details and follows row reordering', async () => {
  await loadDynamicUiExpressions();
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const detail = {
    type: 'Categorization',
    elements: [
      {
        type: 'Category',
        $dynamic: { type: { bind: 'item.kind' }, label: { bind: 'item.name' } },
      },
    ],
  };
  const Parent = (props: any) => (
    <div data-label={props.uischema.elements[0].label} />
  );
  const Other = () => <div data-other />;
  const Rows = withJsonFormsControlProps((props: any) => (
    <>
      {props.data.items.map((item: any, index: number) => (
        <div key={item.id} data-item={item.id}>
          <JsonFormsDispatch
            schema={{ type: 'object' }}
            uischema={detail}
            path={`items.${index}`}
          />
        </div>
      ))}
    </>
  ));
  const props = {
    schema: {
      type: 'object',
      properties: { items: { type: 'array', items: { type: 'object' } } },
    },
    uischema: { type: 'Control', scope: '#', options: { rows: true } },
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    renderers: [
      { tester: (ui: any) => (ui.options?.rows ? 20 : -1), renderer: Rows },
      {
        tester: (ui: any) =>
          ui.type === 'Categorization' &&
          ui.elements.every((child: any) => child.type === 'Category')
            ? 10
            : -1,
        renderer: Parent,
      },
      { tester: () => 1, renderer: Other },
    ],
  };
  try {
    await act(async () =>
      root.render(
        <DynamicJsonForms
          {...props}
          data={{
            items: [
              { id: 'a', kind: 'Category', name: 'Ada' },
              { id: 'b', kind: 'Control', name: 'Grace' },
            ],
          }}
        />,
      ),
    );
    expect(
      host
        .querySelector('[data-item=a] [data-label]')
        ?.getAttribute('data-label'),
    ).toBe('Ada');
    expect(host.querySelector('[data-item=b] [data-other]')).not.toBeNull();
    await act(async () =>
      root.render(
        <DynamicJsonForms
          {...props}
          data={{
            items: [
              { id: 'b', kind: 'Category', name: 'Grace' },
              { id: 'a', kind: 'Control', name: 'Ada' },
            ],
          }}
        />,
      ),
    );
    expect(
      host
        .querySelector('[data-item=b] [data-label]')
        ?.getAttribute('data-label'),
    ).toBe('Grace');
    expect(host.querySelector('[data-item=a] [data-other]')).not.toBeNull();
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
