import { JsonSchema, TesterContext } from '@jsonforms/core';
import {
  materialCells,
  materialRenderers,
  materialArrayControlTester,
  materialIntegerControlTester,
  materialNumberControlTester,
  materialTextControlTester,
} from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { muiExtendedRenderers } from '../src';
import {
  isMuiMixedControl,
  muiMixedControlTester,
} from '../src/renderers/MuiMixedRenderer';
import {
  defaultValueForType,
  deleteAtMixedPath,
  getSchemaTypes,
  buildMixedTree,
  mixedTreeNodeLabel,
  renameAtMixedPath,
  schemaForType,
  selectedTypeForData,
} from '../src/renderers/mixed/mixedTypes';

const control = { type: 'Control', scope: '#' } as const;
const context = { rootSchema: {} } as TesterContext;

describe('MUI mixed renderer tester', () => {
  it('claims genuine mixed schemas', () => {
    const schema = { type: ['object', 'array', 'string'] } as JsonSchema;

    expect(isMuiMixedControl(control, schema, context)).toBe(true);
    expect(muiMixedControlTester(control, schema, context)).toBe(21);
  });

  it.each([
    { type: 'object', properties: { name: { type: 'string' } } },
    { allOf: [{ type: 'object' }] },
    { anyOf: [{ type: 'string' }, { type: 'number' }] },
    { oneOf: [{ type: 'string' }, { type: 'number' }] },
  ])('does not claim a specific or combinator schema', (schema) => {
    expect(isMuiMixedControl(control, schema as JsonSchema, context)).toBe(
      false
    );
  });
});

describe('MUI mixed renderer value behavior', () => {
  const schema = {
    type: ['object', 'array', 'string', 'number', 'null'],
    items: { type: 'string' },
  } as JsonSchema;

  it('leaves the type unselected for absent data', () => {
    const types = getSchemaTypes(schema);

    expect(selectedTypeForData(undefined, types)).toBeNull();
    expect(selectedTypeForData(3, types)).toBe('number');
  });

  it('creates defaults with the selected JSON type', () => {
    expect(defaultValueForType(schema, 'object', schema)).toEqual({});
    expect(defaultValueForType(schema, 'array', schema)).toEqual([]);
    expect(defaultValueForType(schema, 'null', schema)).toBeNull();
  });

  it.each([
    ['integer', materialIntegerControlTester],
    ['number', materialNumberControlTester],
    ['string', materialTextControlTester],
  ] as const)(
    'produces a concrete %s schema that selects its value control instead of the array renderer',
    (type, valueTester) => {
      const concreteSchema = schemaForType(schema, type, schema);

      expect(concreteSchema).not.toHaveProperty('items');
      expect(materialArrayControlTester(control, concreteSchema, context)).toBe(
        -1
      );
      expect(valueTester(control, concreteSchema, context)).toBeGreaterThan(-1);
    }
  );

  it('renames and deletes nested values immutably', () => {
    const data = { dynamic: { old: { value: 1 }, keep: true } };
    const renamed = renameAtMixedPath(data, ['dynamic', 'old'], 'next') as any;
    const deleted = deleteAtMixedPath(renamed, ['dynamic', 'next']) as any;

    expect(renamed.dynamic).toEqual({ next: { value: 1 }, keep: true });
    expect(deleted.dynamic).toEqual({ keep: true });
    expect(data.dynamic).toHaveProperty('old');
  });

  it('uses structural labels for mixed tree roots', () => {
    const arrayRoot = buildMixedTree([], { type: 'array' }, {}, 'Value');
    const objectRoot = buildMixedTree({}, { type: 'object' }, {}, 'Value');

    expect(mixedTreeNodeLabel(arrayRoot)).toBe('[]');
    expect(mixedTreeNodeLabel(objectRoot)).toBe('{}');
  });
});

describe('MUI mixed renderer in the complete Material registry', () => {
  const jsonEditorSchema = {
    type: ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'],
    additionalProperties: true,
    items: {
      type: [
        'array',
        'boolean',
        'integer',
        'null',
        'number',
        'object',
        'string',
      ],
    },
  } as JsonSchema;
  const renderValue = async (data: unknown) => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <JsonForms
          cells={materialCells}
          data={data}
          renderers={[...materialRenderers, ...muiExtendedRenderers]}
          schema={jsonEditorSchema}
          uischema={{ type: 'Control', scope: '#/' }}
        />
      );
    });
    const html = container.innerHTML;
    await act(async () => root.unmount());
    container.remove();
    return html;
  };

  it('renders an unselected type error like a normal MUI field', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <JsonForms
          cells={materialCells}
          data={{}}
          renderers={[...materialRenderers, ...muiExtendedRenderers]}
          schema={{ type: ['string', 'boolean', 'integer', 'null'] }}
          uischema={{ type: 'Control', scope: '#/' }}
        />
      );
    });

    const typeField = container.querySelector('.MuiFormControl-root');
    const helperText = typeField?.querySelector('.MuiFormHelperText-root');
    const select = typeField?.querySelector('[role="combobox"]');
    const inputLabel = typeField?.querySelector('.MuiInputLabel-root');
    const outlinedInput = typeField?.querySelector('.MuiOutlinedInput-root');

    expect(inputLabel?.classList).toContain('Mui-error');
    expect(outlinedInput?.classList).toContain('Mui-error');
    expect(helperText?.classList).toContain('Mui-error');
    expect(helperText?.textContent).toContain(
      'must be string,boolean,integer,null'
    );
    expect(select?.getAttribute('aria-describedby')).toBe(helperText?.id);
    expect(container.querySelector('.MuiAlert-root')).toBeNull();

    await act(async () => root.unmount());
    container.remove();
  });

  it.each([
    ['integer', 0, 'number'],
    ['number', 1.5, 'number'],
    ['string', 'value', 'text'],
  ])(
    'renders the normal %s value control without array or clear actions',
    async (_type, data, inputType) => {
      const html = await renderValue(data);

      expect(html).toContain(`type="${inputType}"`);
      expect(html).not.toContain('aria-label="Add"');
      expect(html).not.toContain('No data');
      expect(html).not.toContain('Clear value');
    }
  );

  it('renders no value control for the null type', async () => {
    const html = await renderValue(null);

    expect(html).toContain('>null<');
    expect(html).not.toContain('No applicable renderer found');
    expect(html).not.toContain('type="text"');
    expect(html).not.toContain('type="number"');
  });

  it('renders an array tree with the selector first and icon-only root actions', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <JsonForms
          cells={materialCells}
          data={[]}
          renderers={[...materialRenderers, ...muiExtendedRenderers]}
          schema={{ ...jsonEditorSchema, title: 'Payload' }}
          uischema={{ type: 'Control', scope: '#/' }}
        />
      );
    });

    const summary = container.querySelector<HTMLElement>(
      '.MuiAccordionSummary-root'
    );
    const typeSelector = summary?.querySelector('.MuiFormControl-root');
    const fieldLabel = summary?.querySelector('.MuiTypography-root');
    expect(summary).not.toBeNull();
    expect(typeSelector).not.toBeNull();
    expect(fieldLabel).not.toBeNull();
    expect(
      (typeSelector as Node).compareDocumentPosition(fieldLabel as Node) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    await act(async () => summary?.click());

    const rootNode = container.querySelector('[role="treeitem"]');
    const primitiveToggle = rootNode?.querySelector(
      '[aria-label="Show primitives"]'
    );
    expect(rootNode?.textContent).not.toContain('Value');
    expect(rootNode?.querySelector('[data-json-type="array"]')).not.toBeNull();
    expect(primitiveToggle).not.toBeNull();
    expect(primitiveToggle?.textContent).toBe('');
    expect(container.textContent).not.toContain('SHOW PRIMITIVES');

    await act(async () => root.unmount());
    container.remove();
  });

  it('navigates to a nested structured value without rendering another tree', async () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <JsonForms
          cells={materialCells}
          data={[1, [], {}]}
          renderers={[...materialRenderers, ...muiExtendedRenderers]}
          schema={jsonEditorSchema}
          uischema={{ type: 'Control', scope: '#/' }}
        />
      );
    });

    const summary = container.querySelector<HTMLElement>(
      '.MuiAccordionSummary-root'
    );
    await act(async () => summary?.click());

    const viewNestedArray = container.querySelector<HTMLElement>(
      '[aria-label="View Array"]'
    );
    const viewNestedObject = container.querySelector<HTMLElement>(
      '[aria-label="View Object"]'
    );
    expect(viewNestedArray).not.toBeNull();
    expect(viewNestedObject).not.toBeNull();
    expect(viewNestedArray?.tagName).toBe('SPAN');
    expect(viewNestedObject?.tagName).toBe('SPAN');
    expect(container.querySelectorAll('[role="tree"]')).toHaveLength(1);

    await act(async () => viewNestedObject?.click());

    const selectedNode = Array.from(
      container.querySelectorAll<HTMLElement>('[role="treeitem"]')
    ).find((node) => node.textContent?.includes('Item 2'));
    expect(selectedNode?.getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('[aria-label="View Object"]')).toBeNull();
    expect(container.querySelectorAll('[role="tree"]')).toHaveLength(1);

    await act(async () => root.unmount());
    container.remove();
  });
});
