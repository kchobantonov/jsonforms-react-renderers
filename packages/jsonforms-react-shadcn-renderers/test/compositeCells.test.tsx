import { readFileSync } from 'node:fs';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers, shadcnCells } from '../src';
const staffSchema = JSON.parse(
  readFileSync(
    require.resolve(
      '@chobantonov/jsonforms-extended-spec/examples/array-controls/schema.json'
    ),
    'utf8'
  )
);
const staffData = JSON.parse(
  readFileSync(
    require.resolve(
      '@chobantonov/jsonforms-extended-spec/examples/array-controls/data.json'
    ),
    'utf8'
  )
);

const schema = {
  type: 'object',
  properties: {
    rows: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          address: {
            type: 'object',
            title: 'Address',
            properties: { city: { type: 'string' } },
          },
          phones: { type: 'array', title: 'Phones', items: { type: 'string' } },
        },
      },
    },
  },
};
const initial = {
  rows: [{ name: 'Ada', address: { city: 'London' }, phones: ['123', '456'] }],
};
const ui = {
  type: 'Control',
  scope: '#/properties/rows',
  options: {
    table: true,
    cells: {
      address: {
        summary: { type: 'Control', scope: '#/properties/city' },
        showEmptyButton: true,
      },
      phones: {
        summary: { type: 'Control', scope: '#' },
        showEmptyButton: true,
      },
    },
  },
};
let root: Root;
let container: HTMLDivElement;
let latest: any;
const mount = (
  readonly = false,
  data: any = initial,
  formSchema: any = schema,
  uischema: any = ui
) => {
  act(() =>
    root.render(
      <JsonForms
        schema={formSchema}
        uischema={uischema}
        data={data}
        readonly={readonly}
        renderers={shadcnRenderers}
        cells={shadcnCells}
        onChange={(event) => {
          latest = event.data;
        }}
      />
    )
  );
  act(() => vi.advanceTimersByTime(50));
};
const click = (name: string) => {
  const button = Array.from(document.querySelectorAll('button')).find(
    (b) => (b.getAttribute('aria-label') ?? b.textContent) === name
  );
  expect(button, name).toBeTruthy();
  act(() => button!.click());
  act(() => vi.advanceTimersByTime(50));
};
const change = (value: string) => {
  const input = document.querySelector('[role="dialog"] input')!;
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};
beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  latest = undefined;
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

it('renders object and array summaries in table cells', () => {
  mount();
  expect(container.querySelector('table')).toBeTruthy();
  const edit = container.querySelector('button[aria-label="Edit Address"]')!;
  expect(edit.querySelector('svg')).toBeTruthy();
  expect(edit.textContent).toBe('');
  expect(edit.getAttribute('title')).toBe('Edit Address');
  expect(container.textContent).toContain('London');
  expect(container.textContent).toContain('123, 456');
  expect(container.textContent).not.toContain('No applicable cell');
});
it.each(['Address', 'Phones'])('cancels isolated %s edits', (label) => {
  mount();
  click('Edit ' + label);
  change('Changed');
  expect(latest).toEqual(initial);
  click('Cancel');
  expect(latest).toEqual(initial);
});
it.each(['Address', 'Phones'])('applies isolated %s edits', (label) => {
  mount();
  click('Edit ' + label);
  change('Changed');
  click('Apply');
  expect(
    label === 'Address' ? latest.rows[0].address.city : latest.rows[0].phones[0]
  ).toBe('Changed');
});
it.each(['Address', 'Phones'])('stages clearing %s until Apply', (label) => {
  mount();
  click('Edit ' + label);
  click('Clear');
  expect(latest).toEqual(initial);
  click('Apply');
  expect(
    label === 'Address' ? latest.rows[0].address : latest.rows[0].phones
  ).toEqual(label === 'Address' ? {} : []);
});
it('permits readonly inspection but disables edits and Apply', () => {
  mount(true);
  click('Edit Address');
  expect(
    document.querySelector<HTMLInputElement>('[role="dialog"] input')!.disabled
  ).toBe(true);
  const apply = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent === 'Apply'
  )!;
  expect(apply.disabled).toBe(true);
  expect(document.querySelector('[aria-label="Remove Address"]')).toBeNull();
});
it('renders every mixed column in the shared spec staff table', () => {
  mount(false, staffData, staffSchema, { ...ui, scope: '#/properties/staff' });
  expect(container.querySelectorAll('thead th').length).toBe(
    Object.keys(staffSchema.properties.staff.items.properties).length + 1
  );
  expect(container.textContent).not.toContain('No applicable cell');
});

it('does not overwrite an external change while a draft is open', () => {
  mount();
  click('Edit Address');
  change('Draft');
  mount(false, { rows: [{ ...initial.rows[0], address: { city: 'Paris' } }] });
  const apply = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent === 'Apply'
  )!;
  expect(apply.disabled).toBe(true);
  click('Cancel');
  expect(latest.rows[0].address.city).toBe('Paris');
});
it('reorders table rows with the requested move buttons', () => {
  mount(
    false,
    { rows: [initial.rows[0], { ...initial.rows[0], name: 'Grace' }] },
    schema,
    { ...ui, options: { ...ui.options, showSortButtons: true } }
  );
  click('Move down');
  expect(latest.rows.map((row: any) => row.name)).toEqual(['Grace', 'Ada']);
});

it.each(['Address', 'Phones'])('confirms removing populated %s and preserves it on cancel', (label) => {
  mount();
  const remove = () => {
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button[aria-label^="Remove"]'));
    act(() => buttons[label === 'Address' ? 0 : 1].click());
    act(() => vi.advanceTimersByTime(50));
  };
  remove();
  expect(document.querySelector('[role="dialog"]')).toBeTruthy();
  click('No');
  expect(latest).toEqual(initial);
  remove();
  click('Yes');
  expect(latest.rows[0][label === 'Address' ? 'address' : 'phones']).toBeUndefined();
});

it.each([{}, []])('clears an empty composite without prompting: %j', (value) => {
  mount(false, { rows: [{ address: value }] });
  click('Remove Address');
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(latest.rows[0].address).toBeUndefined();
});

it('shows descendant errors on object and array summaries without leaking sibling errors', () => {
  const invalidSchema = JSON.parse(JSON.stringify(schema));
  invalidSchema.properties.rows.items.properties.address.required = ['city'];
  invalidSchema.properties.rows.items.properties.phones.items.minLength = 3;
  mount(false, { rows: [
    { name: 'Ada', address: {}, phones: ['x', 'y'] },
    { name: 'Grace', address: { city: 'London' }, phones: ['123'] },
  ] }, invalidSchema);
  const composites = container.querySelectorAll('[class~="group/composite"]');
  expect(composites[0].querySelector('button[aria-label*="city"]')).toBeTruthy();
  expect(composites[1].querySelector('button[aria-label*="3"]')).toBeTruthy();
  expect(composites[2].querySelector('svg.lucide-circle-alert')).toBeNull();
  expect(composites[3].querySelector('svg.lucide-circle-alert')).toBeNull();
});

it('renders combinator cells with errors only on the invalid example row', () => {

  const load = (name: string) => JSON.parse(readFileSync(require.resolve(
    '@chobantonov/jsonforms-extended-spec/examples/container-validation-indicator/' + name + '.json'
  ), 'utf8'));
  const exampleSchema = load('schema');
  const exampleData = load('data');
  const exampleUi = load('uischema').elements[1].elements[2].elements[0];
  mount(false, exampleData, exampleSchema, exampleUi);
  const cells = container.querySelectorAll('[class~="group/composite"]');
  // Five complex columns per row: object, array, oneOf, anyOf, allOf.
  expect(cells).toHaveLength(10);
  for (let index = 0; index < 5; index++) {
    expect(cells[index].querySelector('svg.lucide-circle-alert')).toBeTruthy();
    expect(cells[index + 5].querySelector('svg.lucide-circle-alert')).toBeNull();
  }
  for (const label of ['OneOf contact', 'AnyOf contact', 'AllOf contact']) {
    click('Edit ' + label);
    expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    expect(document.querySelector('[role="dialog"]')!.textContent).not.toContain('No applicable renderer');
    expect(document.querySelector('[role="dialog"]')!.textContent).not.toContain('Full name');
    if (label === 'OneOf contact') {
      expect(document.querySelector('[role="dialog"] [role="combobox"]')).toBeTruthy();
      expect(document.querySelector('[role="dialog"] [role="tablist"]')).toBeNull();
    }
    click('Cancel');
  }
});

it.each([false, true])('shows a Label edit action only with explicit detail (detail=%s)', (withDetail) => {

  const presentation = {
    type: 'Control', scope: '#/properties/rows', options: {
      table: true,
      columnDefs: [{ field: 'preview', scope: '#', headerName: 'Preview' }],
      cells: { preview: { summary: { type: 'Label', text: 'Row presentation' }, ...(withDetail ? { detail: { type: 'VerticalLayout', elements: [] } } : {}) } },
    },
  };
  mount(false, initial, schema, presentation);
  expect(container.textContent).toContain('Row presentation');
  expect(container.textContent).toContain('Preview');
  const edit = container.querySelector<HTMLButtonElement>('[aria-label^="Edit "]');
    expect(Boolean(edit)).toBe(withDetail);
    const label = Array.from(container.querySelectorAll('span')).find(el => el.textContent === 'Row presentation');
    act(() => label?.click());
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    if (edit) {
      act(() => edit.click());
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    }
  expect(container.querySelector('[aria-label^="Remove "]')).toBeNull();
});
