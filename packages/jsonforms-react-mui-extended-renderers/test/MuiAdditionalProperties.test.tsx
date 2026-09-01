import { JsonSchema, TesterContext } from '@jsonforms/core';
import {
  materialCells,
  materialObjectControlTester,
  materialRenderers,
} from '@jsonforms/material-renderers';
import { JsonForms } from '@jsonforms/react';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { muiExtendedRenderers } from '../src';
import { muiAdditionalPropertiesObjectTester } from '../src/renderers/MuiAdditionalPropertiesObjectRenderer';
import { MuiAdditionalProperties } from '../src/renderers/additionalProperties/MuiAdditionalProperties';
import {
  getDynamicPropertySchema,
  renameObjectProperty,
} from '../src/renderers/additionalProperties/additionalPropertyUtils';

const control = { type: 'Control', scope: '#/' } as const;
const context = { rootSchema: {} } as TesterContext;

describe('MUI additional properties tester and schema selection', () => {
  it('outranks the upstream Material object renderer', () => {
    const schema = { type: 'object', additionalProperties: true } as JsonSchema;

    expect(muiAdditionalPropertiesObjectTester(control, schema, context)).toBe(
      3
    );
    expect(materialObjectControlTester(control, schema, context)).toBe(2);
  });

  it('composes every matching pattern schema', () => {
    const schema = {
      type: 'object',
      patternProperties: {
        '^value': { type: 'string' },
        name$: { minLength: 3 },
      },
      additionalProperties: false,
    } as JsonSchema;

    expect(
      getDynamicPropertySchema('value_name', schema, schema, false, false)
    ).toMatchObject({
      allOf: [{ type: 'string' }, { minLength: 3 }],
      title: 'value_name',
    });
    expect(
      getDynamicPropertySchema('other', schema, schema, false, false)
    ).toBeUndefined();
    expect(
      getDynamicPropertySchema('legacy', schema, schema, false, true)
    ).toMatchObject({ title: 'legacy' });
  });

  it('renames atomically without changing key order or value', () => {
    expect(
      renameObjectProperty(
        { first: 1, dynamic: { nested: true }, last: 3 },
        'dynamic',
        'renamed'
      )
    ).toEqual({ first: 1, renamed: { nested: true }, last: 3 });
  });
});

describe('MUI additional properties in the complete Material registry', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    document.body
      .querySelectorAll('[role="presentation"]')
      .forEach((node) => node.remove());
  });

  const renderForm = async (
    schema: JsonSchema,
    data: Record<string, unknown>,
    onChange = vi.fn()
  ) => {
    const Harness = () => {
      const [currentData, setCurrentData] = React.useState(data);
      return (
        <JsonForms
          cells={materialCells}
          data={currentData}
          onChange={(event) => {
            setCurrentData(event.data);
            onChange(event);
          }}
          renderers={[...materialRenderers, ...muiExtendedRenderers]}
          schema={schema}
          uischema={{ type: 'Control', scope: '#/' }}
        />
      );
    };
    await act(async () => {
      root.render(<Harness />);
    });
    return onChange;
  };

  const setInputValue = async (input: HTMLInputElement, value: string) => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set;
    await act(async () => {
      setter?.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };

  it('renders MUI add, rename, delete, and value controls', async () => {
    await renderForm(
      {
        type: 'object',
        properties: { declared: { type: 'string' } },
        additionalProperties: { type: 'string' },
      },
      { declared: 'fixed', dynamic: 'value' }
    );

    expect(
      container.querySelector('.jsonforms-mui-additional-properties')
    ).not.toBeNull();
    expect(
      container.querySelector('[aria-label="Add property"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[aria-label="Rename dynamic"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[aria-label="Delete dynamic"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[aria-label="Rename declared"]')
    ).toBeNull();
    expect(container.textContent).toContain('dynamic');
  });

  it('adds a schema-typed dynamic property', async () => {
    const schema = {
      type: 'object',
      additionalProperties: { type: 'string' },
    } as JsonSchema;
    const handleChange = vi.fn();
    await act(async () => {
      root.render(
        <MuiAdditionalProperties
          cells={materialCells}
          data={{}}
          enabled
          handleChange={handleChange}
          label='Object'
          path=''
          renderers={[...materialRenderers, ...muiExtendedRenderers]}
          rootSchema={schema}
          schema={schema}
          uischema={{ type: 'Control', scope: '#/' }}
        />
      );
    });
    const input = container.querySelector<HTMLInputElement>(
      '.jsonforms-mui-additional-properties input'
    );
    expect(input).not.toBeNull();
    await setInputValue(input as HTMLInputElement, 'newProperty');
    expect(
      container.querySelector<HTMLButtonElement>(
        'button[aria-label="Add property"]'
      )?.disabled
    ).toBe(false);
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('button[aria-label="Add property"]')
        ?.click();
    });

    expect(handleChange).toHaveBeenCalledWith('', {
      newProperty: '',
    });
  });

  it('uses propertyNames validation from the form AJV', async () => {
    await renderForm(
      {
        type: 'object',
        propertyNames: { minLength: 3 },
        additionalProperties: true,
      },
      {}
    );
    const input = container.querySelector<HTMLInputElement>(
      '.jsonforms-mui-additional-properties input'
    ) as HTMLInputElement;
    await setInputValue(input, 'x');

    expect(container.textContent).toContain(
      'must NOT have fewer than 3 characters'
    );
    expect(
      container.querySelector<HTMLButtonElement>(
        'button[aria-label="Add property"]'
      )?.disabled
    ).toBe(true);
  });

  it('deletes only the selected dynamic property', async () => {
    const schema = {
      type: 'object',
      additionalProperties: { type: 'number' },
    } as JsonSchema;
    const handleChange = vi.fn();
    await act(async () => {
      root.render(
        <MuiAdditionalProperties
          cells={materialCells}
          data={{ first: 1, second: 2 }}
          enabled
          handleChange={handleChange}
          label='Object'
          path=''
          renderers={[...materialRenderers, ...muiExtendedRenderers]}
          rootSchema={schema}
          schema={schema}
          uischema={{ type: 'Control', scope: '#/' }}
        />
      );
    });
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('button[aria-label="Delete first"]')
        ?.click();
    });

    expect(handleChange).toHaveBeenCalledWith('', { second: 2 });
  });

  it('renames through the dialog without changing the value', async () => {
    const schema = {
      type: 'object',
      additionalProperties: { type: 'object' },
    } as JsonSchema;
    const handleChange = vi.fn();
    await act(async () => {
      root.render(
        <MuiAdditionalProperties
          cells={materialCells}
          data={{ dynamic: { nested: true } }}
          enabled
          handleChange={handleChange}
          label='Object'
          path=''
          renderers={[...materialRenderers, ...muiExtendedRenderers]}
          rootSchema={schema}
          schema={schema}
          uischema={{ type: 'Control', scope: '#/' }}
        />
      );
    });
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('button[aria-label="Rename dynamic"]')
        ?.click();
    });
    const renameInput = document.body.querySelector<HTMLInputElement>(
      'input[value="dynamic"]'
    );
    expect(renameInput).not.toBeNull();
    await setInputValue(renameInput as HTMLInputElement, 'renamed');
    const renameButton = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('button')
    ).find((button) => button.textContent === 'Rename');
    await act(async () => renameButton?.click());

    expect(handleChange).toHaveBeenCalledWith('', {
      renamed: { nested: true },
    });
  });

  it('enforces max, min, and required property restrictions by default', async () => {
    const schema = {
      type: 'object',
      additionalProperties: { type: 'number' },
      maxProperties: 2,
      minProperties: 2,
      required: ['requiredDynamic'],
    } as JsonSchema;
    await act(async () => {
      root.render(
        <MuiAdditionalProperties
          cells={materialCells}
          data={{ requiredDynamic: 1, optionalDynamic: 2 }}
          enabled
          handleChange={vi.fn()}
          label='Object'
          path=''
          renderers={[...materialRenderers, ...muiExtendedRenderers]}
          rootSchema={schema}
          schema={schema}
          uischema={{ type: 'Control', scope: '#/' }}
        />
      );
    });

    expect(
      container.querySelector<HTMLButtonElement>(
        'button[aria-label="Add property"]'
      )?.disabled
    ).toBe(true);
    expect(
      container.querySelector<HTMLButtonElement>(
        'button[aria-label="Delete requiredDynamic"]'
      )?.disabled
    ).toBe(true);
    expect(
      container.querySelector<HTMLButtonElement>(
        'button[aria-label="Delete optionalDynamic"]'
      )?.disabled
    ).toBe(true);
  });
});
