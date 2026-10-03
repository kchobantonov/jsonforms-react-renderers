import { TupleField } from '../src/complex/TupleField';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';

const object = {
  type: 'object',
  properties: { name: { type: 'string' }, note: { type: 'string' } },
};
const registered = {
  type: 'Control',
  scope: '#/properties/name',
  label: 'Registered name',
};
const inline = {
  type: 'Control',
  scope: '#/properties/note',
  label: 'Chosen note',
};
const registry = [
  {
    tester: (schema: any) => (schema.properties?.name ? 10 : -1),
    uischema: registered,
  },
];

it.each(['object', 'mixed', 'cell'] as const)(
  'resolves generated and registered details for %s',
  async (kind) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    try {
      for (const [detail, expected] of [
        ['GENERATE', 'generated'],
        ['REGISTERED', 'registered'],
        [inline, 'inline'],
      ] as const) {
        const schema =
          kind === 'cell'
            ? {
                type: 'array',
                items: { type: 'object', properties: { value: object } },
              }
            : kind === 'mixed'
            ? { ...object, type: ['object', 'string'] }
            : object;
        const ui = {
          type: 'Control',
          scope: '#',
          options:
            kind === 'cell'
              ? { table: true, cells: { value: { detail } } }
              : { detail, structuredLayout: 'nested', collapsed: false },
        };
        await act(async () =>
          root.render(
            <JsonForms
              key={expected}
              schema={schema as any}
              data={
                kind === 'cell'
                  ? [{ value: { name: 'Ada', note: 'Keep' } }]
                  : { name: 'Ada', note: 'Keep' }
              }
              uischema={ui}
              uischemas={registry}
              renderers={antdRenderers}
              cells={antdCells}
            />
          )
        );
        if (kind === 'cell')
          await act(async () =>
            host
              .querySelector<HTMLButtonElement>('button[aria-label^="Edit"]')!
              .click()
          );
        const area =
          kind === 'cell' ? document.querySelector('[role="dialog"]')! : host;
        expect(area).toBeTruthy();
        expect(area.textContent).not.toContain('No applicable');
        const values = Array.from(area.querySelectorAll('input')).map(
          (input) => input.value
        );
        expect(values.includes('Ada')).toBe(expected !== 'inline');
        expect(values.includes('Keep')).toBe(expected !== 'registered');
        if (expected === 'registered')
          expect(area.textContent).toContain('Registered name');
      }
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);

it.each(['nested', 'tree'])(
  'uses type-specific mixed inline layouts in %s presentation',
  async (structuredLayout) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    try {
      await act(async () =>
        root.render(
          <JsonForms
            schema={{ ...object, type: ['object', 'string'] } as any}
            data={{ name: 'Ada', note: 'Keep' }}
            uischemas={registry}
            uischema={{
              type: 'Control',
              scope: '#',
              options: {
                structuredLayout,
                collapsed: false,
                detail: 'REGISTERED',
                'object-detail': inline,
              },
            }}
            renderers={antdRenderers}
            cells={antdCells}
          />
        )
      );
      expect(host.querySelector('input[value="Keep"]')).toBeTruthy();
      expect(host.querySelector('input[value="Ada"]')).toBeNull();
      expect(host.textContent).toContain('Chosen note');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);

it.each(['GENERATE', 'REGISTERED'])(
  'resolves a tuple position editor with %s',
  async (detail) => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const tupleSchema = {
      type: 'array',
      items: [object],
      additionalItems: false,
    };
    const Position = () => (
      <TupleField
        schema={object}
        prefix={[object]}
        index={0}
        arrayPath=''
        rootSchema={tupleSchema as any}
        enabled
        options={{}}
        uischema={{ type: 'Control', scope: '#', options: { detail } } as any}
      />
    );
    try {
      await act(async () =>
        root.render(
          <JsonForms
            schema={tupleSchema as any}
            data={[{ name: 'Ada', note: 'Keep' }]}
            uischemas={registry}
            uischema={{
              type: 'Control',
              scope: '#',
              options: { testPosition: true },
            }}
            renderers={[
              {
                tester: (ui) => (ui.options?.testPosition ? 100 : -1),
                renderer: Position,
              },
              ...antdRenderers,
            ]}
            cells={antdCells}
          />
        )
      );
      await act(async () =>
        host
          .querySelector<HTMLButtonElement>('button[aria-label^="Edit"]')!
          .click()
      );
      const dialog = document.querySelector('[role="dialog"]')!;
      expect(dialog).toBeTruthy();
      const values = Array.from(dialog.querySelectorAll('input')).map(
        (input) => input.value
      );
      expect(values).toContain('Ada');
      expect(values.includes('Keep')).toBe(detail === 'GENERATE');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);

it('switches the mixed inline layout when the value type changes', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  const render = (data: unknown) =>
    root.render(
      <JsonForms
        schema={{ ...object, type: ['object', 'string'] } as any}
        data={data}
        uischema={{
          type: 'Control',
          scope: '#',
          options: {
            structuredLayout: 'nested',
            collapsed: false,
            'object-detail': inline,
            'string-detail': {
              type: 'VerticalLayout',
              elements: [
                { type: 'Label', text: 'String editor' },
                { type: 'Control', scope: '#' },
              ],
            },
          },
        }}
        renderers={antdRenderers}
        cells={antdCells}
      />
    );
  try {
    await act(async () => render({ name: 'Ada', note: 'Keep' }));
    expect(host.querySelector('input[value="Keep"]')).toBeTruthy();
    await act(async () => render('Hello'));
    expect(host.textContent).toContain('String editor');
    expect(host.querySelector('input[value="Hello"]')).toBeTruthy();
    expect(host.querySelector('input[value="Keep"]')).toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});

it('renders the published editor-detail example', async () => {
  const schema = await import(
    '@chobantonov/jsonforms-extended-spec/examples/editor-details/schema.json'
  );
  const ui = await import(
    '@chobantonov/jsonforms-extended-spec/examples/editor-details/uischema.json'
  );
  const data = await import(
    '@chobantonov/jsonforms-extended-spec/examples/editor-details/data.json'
  );
  // @ts-ignore Trusted executable registry.
  const registrations = await import(
    '@chobantonov/jsonforms-extended-spec/examples/editor-details/uischemas.mjs'
  );
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema.default as any}
          data={data.default}
          uischema={ui.default}
          uischemas={registrations.uischemas}
          renderers={antdRenderers}
          cells={antdCells}
        />
      )
    );
    expect(host.querySelector('input[value="Generated field"]')).toBeTruthy();
    expect(
      host.querySelector('input[value="Type-specific field"]')
    ).toBeTruthy();
    await act(async () =>
      host
        .querySelector<HTMLButtonElement>('button[aria-label^="Edit"]')!
        .click()
    );
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Registered name');
    expect(
      dialog.querySelector('input[value="Open the cell editor"]')
    ).toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
