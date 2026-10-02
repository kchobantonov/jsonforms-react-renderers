import { createAjv } from '@jsonforms/core';
// @ts-ignore Trusted example registry is published as JavaScript.
import { uischemas } from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/uischemas.mjs';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';
import schema from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/schema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/translations.json';
import ui from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/uischema.json';

it.each(ui.elements)(
  'mounts recursive tree: $label without mutating data',
  async (category) => {
    const original = JSON.stringify(data);
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    try {
      await act(async () =>
        root.render(
          <JsonForms
            ajv={createAjv({ useDefaults: true })}
            uischemas={uischemas}
            schema={schema as any}
            data={data}
            i18n={{
              locale: 'bg',
              translate: (key, fallback) =>
                translations.bg[key as keyof typeof translations.bg] ??
                fallback,
            }}
            uischema={
              { type: 'VerticalLayout', elements: category.elements } as any
            }
            renderers={antdRenderers}
            cells={antdCells}
          />
        )
      );
      expect(host.textContent).not.toContain('No applicable renderer');
      expect(host.querySelectorAll('input[id*="kind"]').length).toBe(0);
      expect(host.textContent).toContain('Вид');
      expect(
        Array.from(
          host.querySelectorAll('[role="combobox"], .ant-select-selection-item')
        ).some((element) =>
          ['file', 'folder'].includes(element.textContent?.trim() ?? '')
        )
      ).toBe(false);
      expect(host.textContent).toContain('Деца');
      expect(host.textContent).toContain('Папка');
      expect(host.querySelectorAll('input').length).toBeGreaterThan(0);
      expect(JSON.stringify(data)).toBe(original);
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);

it('adds one child to an empty recursive folder without generating descendants', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let latest: any;
  try {
    await act(async () =>
      root.render(
        <JsonForms
          ajv={createAjv({ useDefaults: true })}
          uischemas={uischemas}
          schema={schema as any}
          data={data}
          uischema={{ type: 'Control', scope: '#/properties/empty' }}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={(event) => {
            latest = event.data;
          }}
        />
      )
    );
    const add = host
      .querySelector<HTMLElement>('[aria-label="plus"]')
      ?.closest('button');
    expect(add).not.toBeNull();
    await act(async () => add!.click());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(latest.empty.children).toHaveLength(1);
    expect(latest.empty.children[0]).toEqual({});
    expect(host.textContent).toContain('Choose a kind.');
    expect(
      host.querySelector('[role="combobox"][aria-invalid="true"]')
    ).not.toBeNull();
    expect(JSON.stringify(latest.empty).length).toBeLessThan(300);
    expect(latest.populated).toEqual(data.populated);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('initializes the selected folder when switching from a file', async () => {
  const scrollIntoView = HTMLElement.prototype.scrollIntoView;
  HTMLElement.prototype.scrollIntoView = () => {};
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let latest: any;
  try {
    await act(async () =>
      root.render(
        <JsonForms
          ajv={createAjv({ useDefaults: true })}
          uischemas={uischemas}
          schema={schema as any}
          data={{ empty: { kind: 'file', name: 'Old file' } }}
          config={{ jsonformsExtended: { confirmation: { default: 'never' } } }}
          uischema={{ type: 'Control', scope: '#/properties/empty' }}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={(event) => {
            latest = event.data;
          }}
        />
      )
    );
    await act(async () => {
      host
        .querySelector('[role="combobox"]')!
        .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    const folder = document.querySelector<HTMLElement>(
      '.ant-select-item-option[title="Folder"]'
    );
    expect(folder).not.toBeNull();
    await act(async () => folder!.click());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(latest.empty.kind).toBe('folder');
    expect(latest.empty.children).toEqual([]);
    expect(latest.empty.name).not.toBe('Old file');
  } finally {
    act(() => root.unmount());
    host.remove();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
  }
});

it('creates a file only after choosing a branch for an empty node', async () => {
  const scrollIntoView = HTMLElement.prototype.scrollIntoView;
  HTMLElement.prototype.scrollIntoView = () => {};
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let latest: any;
  try {
    await act(async () =>
      root.render(
        <JsonForms
          ajv={createAjv({ useDefaults: true })}
          uischemas={uischemas}
          schema={schema as any}
          data={{ empty: {} }}
          config={{ jsonformsExtended: { confirmation: { default: 'never' } } }}
          uischema={{ type: 'Control', scope: '#/properties/empty' }}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={(event) => {
            latest = event.data;
          }}
        />
      )
    );
    await act(async () => {
      host
        .querySelector('[role="combobox"]')!
        .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    const folder = document.querySelector<HTMLElement>(
      '.ant-select-item-option[title="File"]'
    );
    expect(folder).not.toBeNull();
    await act(async () => folder!.click());
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(latest.empty.kind).toBe('file');
    expect(latest.empty.children).toBeUndefined();
    expect(latest.empty.name).not.toBe('Old file');
  } finally {
    act(() => root.unmount());
    host.remove();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
  }
});

it('clears the selected branch when the document is externally cleared', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const render = async (value: any) => {
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema as any}
          data={value}
          uischemas={uischemas}
          uischema={{
            type: 'Control',
            scope: '#/properties/populated',
            label: 'Kind',
          }}
          renderers={antdRenderers}
          cells={antdCells}
        />
      )
    );
  };
  try {
    await render(data);
    expect(host.textContent).toContain('Folder');
    await render({});
    expect(host.textContent).not.toContain('Folder');
    expect(host.textContent).not.toContain('Children');
    await render(data);
    await render(undefined);
    expect(host.textContent).not.toContain('Folder');
    expect(host.textContent).not.toContain('Children');
  } finally {
    act(() => root.unmount());
  }
});

it('clears a child kind to an empty object without removing its slot', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let latest: any;
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema as any}
          uischemas={uischemas}
          ajv={createAjv({ useDefaults: true })}
          data={{
            empty: {
              kind: 'folder',
              name: 'Parent',
              children: [{ kind: 'file', name: 'Child' }],
            },
          }}
          config={{ jsonformsExtended: { confirmation: { default: 'never' } } }}
          uischema={{ type: 'Control', scope: '#/properties/empty' }}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={(event) => {
            latest = event.data;
          }}
        />
      )
    );
    const clears = host.querySelectorAll('.ant-select-clear');
    expect(clears.length).toBeGreaterThan(1);
    await act(async () =>
      clears[clears.length - 1].dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      )
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(latest.empty.children).toEqual([{}]);
    expect(JSON.stringify(latest.empty.children)).toBe('[{}]');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('marks invalid child headers while collapsed and honors the indicator setting', async () => {
  const host = document.createElement('div');
  const root = createRoot(host);
  const render = async (show: boolean) => {
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema as any}
          uischemas={uischemas}
          data={{
            empty: {
              kind: 'folder',
              name: 'Parent',
              children: [{ kind: 'file', name: 'Valid' }, {}],
            },
          }}
          config={{
            jsonformsExtended: {
              showValidationIndicator: show,
              collapsed: true,
            },
          }}
          uischema={{ type: 'Control', scope: '#/properties/empty' }}
          renderers={antdRenderers}
          cells={antdCells}
        />
      )
    );
  };
  try {
    await render(true);
    const headers = () =>
      Array.from(host.querySelectorAll('.ant-collapse-header'));
    expect(
      headers().some((header) =>
        header.querySelector('[data-container-validation-indicator]')
      )
    ).toBe(true);
    await render(false);
    expect(
      headers().some((header) =>
        header.querySelector('[data-container-validation-indicator]')
      )
    ).toBe(false);
  } finally {
    act(() => root.unmount());
  }
});
