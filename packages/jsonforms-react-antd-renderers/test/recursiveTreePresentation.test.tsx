import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { createAjv } from '@jsonforms/core';
import { antdRenderers, antdCells } from '../src';
import schema from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/schema.json';
import exampleData from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/data.json';
// @ts-ignore Published trusted registry.
import { uischemas } from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/uischemas.mjs';
const ui = {
  type: 'Control',
  scope: '#/properties/populated',
  label: 'Kind',
  options: {
    recursiveTree: {
      childrenProperty: 'children',
      labelProperty: 'name',
      detail: { type: 'Control', scope: '#', label: 'Kind' },
    },
  },
};

it('navigates and edits individual nodes without rendering descendant fields or changing siblings', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let latest: any;
  const initial = JSON.parse(JSON.stringify(exampleData));
  const ajv = createAjv({ useDefaults: true });
  function Form() {
    const [data, setData] = useState(initial);
    return (
      <JsonForms
        schema={schema as any}
        data={data}
        ajv={ajv}
        uischemas={uischemas}
        uischema={ui}
        renderers={antdRenderers}
        cells={antdCells}
        onChange={({ data: next }) => {
          latest = next;
          setData(next);
        }}
      />
    );
  }
  try {
    await act(async () => root.render(<Form />));
    const pane = () => host.querySelector('[data-recursive-tree-detail]')!;
    expect(pane().querySelectorAll('input[id*="name"]').length).toBe(1);
    const node = Array.from(
      host.querySelectorAll('[data-recursive-node]')
    ).find((el) => el.textContent?.includes('readme.txt'))!;
    expect(node).toBeTruthy();
    await act(async () => (node as HTMLElement).click());
    const input = pane().querySelector('input[id*="name"]') as HTMLInputElement;
    expect(input.value).toBe('readme.txt');
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, 'updated.txt');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(latest.populated.children[0].name).toBe('updated.txt');
    expect(latest.populated.children[1]).toEqual(initial.populated.children[1]);
    expect(host.textContent).not.toContain('No applicable');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('marks invalid nodes and ancestors, honors hidden indicators, and permits read-only navigation', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const data = { populated: { kind: 'folder', name: 'Root', children: [{}] } };
  const render = (show: boolean) => (
    <JsonForms
      schema={schema as any}
      data={data}
      uischemas={uischemas}
      uischema={ui}
      readonly
      config={{ jsonformsExtended: { showValidationIndicator: show } }}
      renderers={antdRenderers}
      cells={antdCells}
    />
  );
  try {
    await act(async () => root.render(render(true)));
    expect(
      host.querySelectorAll(
        '[data-recursive-tree] [data-container-validation-indicator]'
      ).length
    ).toBeGreaterThanOrEqual(2);
    expect(
      host.querySelector('[data-recursive-node] button[aria-label^="Rename"]')
    ).toBeNull();
    expect(
      host.querySelector('[data-recursive-node] button[aria-label^="Delete"]')
    ).toBeNull();
    const nodes = host.querySelectorAll('[data-recursive-node]');
    await act(async () => (nodes[1] as HTMLElement).click());
    expect(
      host.querySelector('[data-recursive-tree-detail]')?.textContent
    ).toContain('Choose a kind');
    await act(async () => root.render(render(false)));
    expect(
      host.querySelectorAll(
        '[data-recursive-tree] [data-container-validation-indicator]'
      ).length
    ).toBe(0);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('adds empty child nodes through the native collection actions and opens their editor', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let latest: any;
  const ajv = createAjv({ useDefaults: true });
  const initial = { populated: { kind: 'folder', name: 'Root', children: [] } };
  function Form() {
    const [data, setData] = useState(initial);
    return (
      <JsonForms
        schema={schema as any}
        data={data}
        ajv={ajv}
        uischemas={uischemas}
        uischema={ui}
        renderers={antdRenderers}
        cells={antdCells}
        onChange={({ data: next }) => {
          latest = next;
          setData(next);
        }}
      />
    );
  }
  try {
    await act(async () => root.render(<Form />));
    const add = host.querySelector('[aria-label="plus"]')?.closest('button');
    expect(add).toBeTruthy();
    await act(async () => add!.click());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(latest.populated.children).toEqual([{}]);
    const nodes = host.querySelectorAll('[data-recursive-node]');
    expect(nodes.length).toBe(2);
    await act(async () => (nodes[1] as HTMLElement).click());
    expect(
      host.querySelector('[data-recursive-tree-detail]')?.textContent
    ).toContain('Choose a kind');
    expect(host.textContent).not.toContain('No applicable');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('renames and deletes a child directly from the tree while preserving siblings', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let latest: any;
  const initial = JSON.parse(JSON.stringify(exampleData));
  function Form() {
    const [data, setData] = useState(initial);
    return (
      <JsonForms
        schema={schema as any}
        data={data}
        uischemas={uischemas}
        uischema={{
          ...ui,
          options: { ...ui.options, confirmation: { delete: 'never' } },
        }}
        renderers={antdRenderers}
        cells={antdCells}
        onChange={({ data: next }) => {
          latest = next;
          setData(next);
        }}
      />
    );
  }
  try {
    await act(async () => root.render(<Form />));
    const row = () =>
      Array.from(host.querySelectorAll('[data-recursive-node]')).find((el) =>
        el.textContent?.includes('readme.txt')
      )!;
    const rename = row().querySelector<HTMLButtonElement>(
      'button[aria-label^="Rename"]'
    )!;
    expect(rename).toBeTruthy();
    await act(async () => rename.click());
    const input = document.querySelector(
      '[role="dialog"] input'
    ) as HTMLInputElement;
    expect(input.value).toBe('readme.txt');
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, 'renamed.txt');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () =>
      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          bubbles: true,
        })
      )
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });
    expect(latest.populated.children[0].name).toBe('renamed.txt');
    const renamed = Array.from(
      host.querySelectorAll('[data-recursive-node]')
    ).find((el) => el.textContent?.includes('renamed.txt'))!;
    await act(async () =>
      renamed
        .querySelector<HTMLButtonElement>('button[aria-label^="Delete"]')!
        .click()
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });
    expect(latest.populated.children).toEqual([initial.populated.children[1]]);
    expect(latest.empty).toEqual(initial.empty);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('hides schema-forbidden rename and delete actions on tree rows', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const constrained = JSON.parse(JSON.stringify(schema));
  constrained.definitions.folder.properties.children.minItems = 1;
  constrained.definitions.file.properties.name.readOnly = true;
  const data = {
    populated: {
      kind: 'folder',
      name: 'Root',
      children: [{ kind: 'file', name: 'locked.txt' }],
    },
  };
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={constrained}
          data={data}
          uischemas={uischemas}
          uischema={ui}
          renderers={antdRenderers}
          cells={antdCells}
        />
      )
    );
    const row = Array.from(host.querySelectorAll('[data-recursive-node]')).find(
      (el) => el.textContent?.includes('locked.txt')
    )!;
    expect(row).toBeTruthy();
    expect(row.querySelector('button[aria-label^="Rename"]')).toBeNull();
    expect(row.querySelector('button[aria-label^="Delete"]')).toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it.each(['GENERATE', 'REGISTERED'])(
  'resolves recursive node detail mode %s',
  async (detail) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    try {
      await act(async () =>
        root.render(
          <JsonForms
            schema={schema as any}
            data={exampleData}
            uischema={{
              ...ui,
              options: {
                ...ui.options,
                recursiveTree: { ...ui.options.recursiveTree, detail },
              },
            }}
            uischemas={[
              {
                tester: () => 20,
                uischema: { type: 'Label', text: 'Registered node detail' },
              },
              ...uischemas,
            ]}
            renderers={antdRenderers}
            cells={antdCells}
          />
        )
      );
      const pane = host.querySelector('[data-recursive-tree-detail]')!;
      expect(pane.textContent?.includes('Registered node detail')).toBe(
        detail === 'REGISTERED'
      );
      expect(pane.textContent).not.toContain('No applicable');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);
