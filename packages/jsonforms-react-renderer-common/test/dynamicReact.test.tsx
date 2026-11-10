import { TRUST_DYNAMIC_FUNCTIONS } from '../src/dynamicConfig';
import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';
import {
  DispatchCell,
  JsonFormsDispatch,
  withJsonFormsControlProps,
  withJsonFormsCellProps,
} from '@jsonforms/react';
import { DynamicJsonForms, useDynamicElements } from '../src/DynamicUiProvider';

let host: HTMLDivElement;
let root: Root;
let mounts = 0;
const Text = withJsonFormsControlProps((props: any) => {
  const [instance] = useState(() => ++mounts);
  const [draft, setDraft] = useState('unfinished');
  return (
    <input
      data-instance={instance}
      aria-label={props.label}
      value={draft}
      readOnly={props.readonly}
      onChange={(event) => setDraft(event.target.value)}
    />
  );
});
const Radio = withJsonFormsControlProps((props: any) => (
  <button aria-label={props.label}>Radio</button>
));
const renderers = [
  {
    tester: (ui: any) => (ui.options?.format === 'radio' ? 5 : -1),
    renderer: Radio,
  },
  { tester: () => 1, renderer: Text },
];
const ui = {
  type: 'Control',
  scope: '#/properties/name',
  label: 'Name',
  $dynamic: {
    label: { bind: 'external.label' },
    options: {
      format: { bind: 'external.format' },
      readonly: { bind: 'external.readonly' },
    },
  },
};
const initial = {
  data: { name: 'Ada', alternate: 'Grace' },
  schema: {
    type: 'object',
    properties: { name: { type: 'string' }, alternate: { type: 'string' } },
  },
  uischema: ui,
  renderers,
};
const update = async (props: any) => {
  await act(async () =>
    root.render(<DynamicJsonForms {...initial} {...props} />),
  );
  if (props.config?.jsonformsExtended?.dynamic?.enabled === true) {
    await act(async () => {
      await import('../src/dynamicRuntime').then((runtime) =>
        runtime.loadDynamicUiExpressions(),
      );
    });
  }
};
beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  mounts = 0;
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

it('updates effective props, preserves drafts and switches only the selected editor', async () => {
  const onChange = vi.fn();
  await update({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { label: 'Plan', format: 'text', readonly: false },
    onChange,
  });
  const input = host.querySelector('input')!;
  await update({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { label: 'Updated', format: 'text', readonly: true },
    onChange,
  });
  expect(host.querySelector('input')).toBe(input);
  expect(input.getAttribute('aria-label')).toBe('Updated');
  expect(input.readOnly).toBe(true);
  expect(input.value).toBe('unfinished');
  input.focus();
  await update({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { label: 'Choice', format: 'radio', readonly: false },
    onChange,
  });
  expect(host.querySelector('input')).toBeNull();
  expect(document.activeElement).toBe(host.querySelector('button'));
  await update({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { label: 'Again', format: 'text', readonly: false },
    onChange,
  });
  expect(host.querySelector('input')).not.toBe(input);
  expect(mounts).toBe(2);
  expect(
    onChange.mock.calls.every(([event]) => event.data.name === 'Ada'),
  ).toBe(true);
});

it('keeps the editor on activation changes and does not steal focus', async () => {
  await update({});
  const input = host.querySelector('input');
  await update({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { label: 'Name', format: 'text', readonly: false },
  });
  expect(host.querySelector('input')).toBe(input);
  await update({
    config: { jsonformsExtended: { dynamic: { enabled: false } } },
  });
  expect(host.querySelector('input')).toBe(input);
  const outside = document.createElement('button');
  document.body.append(outside);
  outside.focus();
  await update({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { label: 'Choice', format: 'radio', readonly: false },
  });
  expect(document.activeElement).toBe(outside);
  outside.remove();
});

it('starts a new editing session when effective scope changes', async () => {
  const uischema = { ...ui, $dynamic: { scope: { bind: 'external.scope' } } };
  await update({
    uischema,
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { scope: '#/properties/name' },
  });
  const first = host.querySelector('input');
  await update({
    uischema,
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { scope: '#/properties/alternate' },
  });
  expect(host.querySelector('input')).not.toBe(first);
});

it('resolves compact cell value and readonly before the selected cell binds props', async () => {
  const Cell = withJsonFormsCellProps((props: any) => (
    <input data-label={props.uischema.label} readOnly={props.readonly} />
  ));
  const cellUi = {
    type: 'Control' as const,
    scope: '#/properties/name',
    $dynamic: {
      label: { bind: 'value' },
      options: { readonly: { bind: 'external.readonly' } },
    },
  };
  const Table = () => (
    <DispatchCell
      schema={{ type: 'string' }}
      uischema={cellUi}
      path='name'
      enabled
    />
  );
  await update({
    uischema: { type: 'VerticalLayout' },
    renderers: [{ tester: () => 1, renderer: Table }],
    cells: [{ tester: () => 1, cell: Cell }],
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { readonly: true },
  });
  expect(host.querySelector('input')?.dataset.label).toBe('Ada');
  expect(host.querySelector('input')?.readOnly).toBe(true);
});

it('resolves parent presentation and child item descriptors independently', async () => {
  const child = {
    type: 'Control',
    scope: '#/properties/name',
    $dynamic: { label: { template: '{item.name}:{value}' } },
  };
  const layoutUi = { type: 'VerticalLayout', elements: [child] };
  const Layout = (props: any) => {
    const elements = useDynamicElements(props.uischema.elements, props.path);
    return (
      <>
        {elements.map((element, index) => (
          <div key={index} data-parent-label={(element as any).label}>
            <JsonFormsDispatch
              schema={props.schema}
              uischema={element}
              path={props.path}
            />
          </div>
        ))}
      </>
    );
  };
  const Rows = () => (
    <>
      <JsonFormsDispatch
        schema={initial.schema}
        uischema={layoutUi}
        path='rows.0'
      />

      <JsonFormsDispatch
        schema={initial.schema}
        uischema={layoutUi}
        path='rows.1'
      />
    </>
  );
  await update({
    data: { rows: [{ name: 'First' }, { name: 'Second' }] },
    uischema: { type: 'Rows' },
    renderers: [
      { tester: (e: any) => (e.type === 'Rows' ? 10 : -1), renderer: Rows },
      {
        tester: (e: any) => (e.type === 'VerticalLayout' ? 5 : -1),
        renderer: Layout,
      },
      ...renderers,
    ],
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
  });
  expect(
    Array.from(host.querySelectorAll('input')).map((input) =>
      input.getAttribute('aria-label'),
    ),
  ).toEqual(['First:First', 'Second:Second']);
  expect(
    Array.from(host.querySelectorAll('[data-parent-label]')).map((element) =>
      element.getAttribute('data-parent-label'),
    ),
  ).toEqual(['First:First', 'Second:Second']);
});

it('cancels a pending shared-editor write when dynamic selection disposes it', async () => {
  const { useDebouncedChange } = await import('../src/debounce');
  const commit = vi.fn();
  let type: (event: any) => void;
  const Pending = () => {
    const [value, change] = useDebouncedChange(commit, '', 'Ada', 'name');
    React.useLayoutEffect(() => {
      type = change;
    }, [change]);
    return <input readOnly value={value} />;
  };
  const choices = [
    {
      tester: (element: any) => (element.options?.format === 'radio' ? 5 : -1),
      renderer: Radio,
    },
    { tester: () => 1, renderer: Pending },
  ];
  await update({
    renderers: choices,
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { label: 'Name', format: 'text', readonly: false },
  });
  vi.useFakeTimers();
  try {
    act(() => type({ target: { value: 'Uncommitted' } }));
    await update({
      renderers: choices,
      config: { jsonformsExtended: { dynamic: { enabled: true } } },
      external: { label: 'Name', format: 'radio', readonly: false },
    });
    act(() => vi.runAllTimers());
    expect(commit).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});

it('only evaluates function leaves with activation and the exported capability', async () => {
  const label = vi.fn(() => 'Trusted');
  const uischema = { ...ui, label: 'Static', $dynamic: { label } };
  await update({ uischema, external: { label: 'External' } });
  expect(label).not.toHaveBeenCalled();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    await update({
      uischema,
      config: {
        jsonformsExtended: { dynamic: { enabled: true, trusted: true } },
      },
    });
    expect(label).not.toHaveBeenCalled();
    await update({
      uischema,
      config: {
        jsonformsExtended: {
          dynamic: { enabled: true, trusted: TRUST_DYNAMIC_FUNCTIONS },
        },
      },
    });
    expect(host.querySelector('input')?.getAttribute('aria-label')).toBe(
      'Trusted',
    );
    const calls = label.mock.calls.length;
    await update({
      uischema,
      config: {
        jsonformsExtended: {
          dynamic: { enabled: false, trusted: TRUST_DYNAMIC_FUNCTIONS },
        },
      },
    });
    expect(host.querySelector('input')?.getAttribute('aria-label')).toBe(
      'Static',
    );
    expect(label).toHaveBeenCalledTimes(calls);
  } finally {
    warn.mockRestore();
  }
});
