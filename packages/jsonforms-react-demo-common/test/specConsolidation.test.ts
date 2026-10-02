import { describe, expect, it } from 'vitest';
import { createFormsAjv } from '@chobantonov/jsonforms-react-extended-renderers';
import examples, { isSpecExample, translatorFor } from '../src/examples';

const ajv = createFormsAjv({ allErrors: true });
const find = (id: string) => {
  const example = examples.find((entry) => entry.name === `spec-${id}`);
  expect(example).toBeDefined();
  return example!;
};

describe('consolidated spec fixtures', () => {
  it.each(['file-control', 'code-editor'])(
    '%s registers valid initial data and matching catalogs',
    (id) => {
      const example = find(id);
      expect(isSpecExample(example.name)).toBe(true);
      const validate = ajv.compile(example.schema!);
      expect(validate(example.data), JSON.stringify(validate.errors)).toBe(
        true
      );
      const catalogs = (example as any).translations;
      expect(Object.keys(catalogs.en).sort()).toEqual(
        Object.keys(catalogs.bg).sort()
      );
      expect(translatorFor(catalogs, 'bg')('intro.text')).toBeTruthy();
    }
  );

  it('validates staff independently of the deliberate array errors', () => {
    const example = find('array-controls');
    const validate = ajv.compile((example.schema as any).properties.staff);
    expect(
      validate((example.data as any).staff),
      JSON.stringify(validate.errors)
    ).toBe(true);
    const invalidStaff = JSON.parse(
      JSON.stringify((example.data as any).staff)
    );
    invalidStaff[0].age = -1;
    expect(validate(invalidStaff)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ instancePath: '/0/age', keyword: 'minimum' }),
      ])
    );
  });

  it('keeps JSON conversion validation separate from text syntax', () => {
    const example = find('code-editor');
    const validate = ajv.compile(example.schema!);
    expect(
      validate({
        ...(example.data as object),
        document: { service: 'catalog', replicas: 0 },
      })
    ).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: '/document/replicas',
          keyword: 'minimum',
        }),
      ])
    );
    expect(
      validate({
        ...(example.data as object),
        script: 'not valid JavaScript {',
      })
    ).toBe(true);
  });

  it('accepts the week-based duration without adding a format error', () => {
    const example = find('temporal-controls');
    const validate = ajv.compile(
      (example.schema as any).properties.schemaBased
    );
    expect(
      validate((example.data as any).schemaBased),
      JSON.stringify(validate.errors)
    ).toBe(true);
  });
});

const elementsOf = (ui: any): any[] => [
  ui,
  ...(ui.elements ?? []).flatMap(elementsOf),
];

it('retains the group and layout edge cases transferred from local demos', () => {
  const groups = find('group-layout');
  expect((groups.data as any).active).toBe(false);
  expect((groups.data as any).count).toBe(0);
  const indicator = elementsOf(groups.uischema).find(
    (e) => e.i18n === 'presence.group'
  );
  expect(indicator.options).toEqual({
    collapsible: true,
    collapsed: true,
    showDataIndicator: true,
  });
  const nested = elementsOf(find('layout-sizing').uischema).find(
    (e) => e.i18n === 'nestedSizing.tab'
  );
  expect(
    nested.elements[0].elements.map((e: any) => [e.type, e.options.layout.span])
  ).toEqual([
    ['Label', 4],
    ['Group', 8],
  ]);
});

it('retains scalar and composite cell coverage in tables and grids', () => {
  const example = find('array-controls');
  const controls = elementsOf(example.uischema).filter(
    (e) => e.scope === '#/properties/staff'
  );
  expect(controls.some((e) => e.options.table === true)).toBe(true);
  expect(controls.some((e) => e.options.variant === 'ag-grid')).toBe(true);
  for (const control of controls) {
    expect(control.options.showSortButtons).toBe(true);
    expect(control.options.cells.address.showEmptyButton).toBe(true);
    expect(control.options.cells.phoneNumbers.detail.scope).toBe('#');
    expect(
      elementsOf(control.options.cells.address.detail).some(
        (e) => e.type === 'HorizontalLayout'
      )
    ).toBe(true);
  }
});

it('offers row dialogs and both panel placements alongside complex cell dialogs', () => {
  const example = find('array-controls');
  const elements = elementsOf(example.uischema);
  for (const [name, presentation, placement] of [
    ['rowDialog', 'dialog', undefined],
    ['rowSide', 'panel', 'right'],
    ['rowBottom', 'panel', 'bottom'],
  ]) {
    const category = elements.find((element) => element.name === name);
    const control = category.elements.find(
      (element: any) => element.type === 'Control'
    );
    expect(control.scope).toBe('#/properties/sessions');
    expect(control.options.table).toBe(true);
    expect(control.options.rowDetail.presentation).toBe(presentation);
    expect(control.options.rowDetail.placement).toBe(placement);
    expect(control.options.cells.room.dialog).toMatchObject({
      draggable: true,
      resizable: true,
      maximizable: true,
    });
    if (presentation === 'dialog') {
      expect(control.options.rowDetail.dialog).toMatchObject({
        draggable: true,
        resizable: true,
        maximizable: true,
      });
    }
    expect(
      control.options.rowDetail.detail.elements.map(
        (element: any) => element.scope
      )
    ).toContain('#/properties/room');
    const catalogs = (example as any).translations;
    expect(catalogs.en[`${category.i18n}.label`]).toBeTruthy();
    expect(catalogs.bg[`${category.i18n}.label`]).toBeTruthy();
  }
});
