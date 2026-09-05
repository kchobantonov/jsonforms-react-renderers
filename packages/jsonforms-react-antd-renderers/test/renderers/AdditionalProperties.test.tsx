import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  ControlElement,
  ControlProps,
  createAjv,
  rankWith,
  schemaMatches,
} from '@jsonforms/core';
import {
  JsonForms,
  useJsonForms,
  withJsonFormsControlProps,
} from '@jsonforms/react';
import { AdditionalProperties } from '../../src/complex/AdditionalProperties';
import { InputControl } from '../../src/controls/InputControl';
import { PRESERVE_DYNAMIC_PROPERTY_OPTION } from '../../src/util/dynamicProperties';
import { antdRenderers } from '../../src';

const additionalPropertiesRenderer = withJsonFormsControlProps(
  (props: ControlProps) => (
    <AdditionalProperties
      cells={props.cells}
      config={props.config}
      data={props.data}
      enabled={props.enabled}
      handleChange={props.handleChange}
      label={props.label}
      path={props.path}
      readonly={props.readonly}
      renderers={props.renderers}
      rootSchema={props.rootSchema}
      schema={props.schema}
      uischema={props.uischema as ControlElement}
    />
  )
);

describe('AdditionalProperties', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('resolves a propertyNames $ref against the root schema', () => {
    const rootSchema = {
      type: 'object',
      $defs: {
        propertyName: {
          type: 'string',
          pattern: '^[A-Za-z_][A-Za-z0-9_]*$',
        },
      },
      properties: {
        additionalPropertiesMap: {
          type: 'object',
          additionalProperties: { type: 'string' },
          propertyNames: { $ref: '#/$defs/propertyName' },
        },
      },
    };
    const mapSchema = rootSchema.properties.additionalPropertiesMap;

    act(() => {
      root.render(
        <AdditionalProperties
          data={{}}
          enabled
          handleChange={vi.fn()}
          label='Map'
          path='additionalPropertiesMap'
          rootSchema={rootSchema}
          schema={mapSchema}
          uischema={{
            type: 'Control',
            scope: '#/properties/additionalPropertiesMap',
          }}
        />
      );
    });

    const input = container.querySelector(
      'input[placeholder="Property name"]'
    ) as HTMLInputElement;
    const setInputValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set;

    act(() => {
      setInputValue?.call(input, 'invalid-name');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(
      container.querySelector('.jsonforms-additional-properties-error')
        ?.textContent
    ).toBe('Property name must match pattern: ^[A-Za-z_][A-Za-z0-9_]*$');
    expect(
      (container.querySelector('button') as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it('reuses the parent AJV for dispatched additional-property controls', () => {
    const ajv = createAjv({ unicodeRegExp: false });
    let nestedAjv: unknown;
    const AjvProbe = () => {
      nestedAjv = useJsonForms().core?.ajv;
      return null;
    };
    const schema = {
      type: 'object',
      properties: {
        secretFiles: {
          type: 'object',
          additionalProperties: { type: 'string' },
          propertyNames: {
            pattern: '^"([^"$\\\\]|\\$(?!{)|\\\\.)*"$',
          },
        },
      },
    };

    act(() => {
      root.render(
        <JsonForms
          ajv={ajv}
          data={{ secretFiles: { '"secret"': 'value' } }}
          schema={schema}
          uischema={{
            type: 'Control',
            scope: '#/properties/secretFiles',
          }}
          renderers={[
            {
              tester: rankWith(
                10,
                schemaMatches((candidate) => candidate.type === 'object')
              ),
              renderer: additionalPropertiesRenderer,
            },
            {
              tester: rankWith(
                100,
                schemaMatches((candidate) => candidate.type === 'string')
              ),
              renderer: AjvProbe,
            },
          ]}
        />
      );
    });

    expect(nestedAjv).toBe(ajv);
  });

  it('renders a dynamic primitive property label only once', () => {
    act(() => {
      root.render(
        <JsonForms
          data={{ string12: 'value' }}
          schema={{
            type: 'object',
            additionalProperties: { type: 'string' },
          }}
          uischema={{ type: 'Control', scope: '#' }}
          renderers={antdRenderers}
        />
      );
    });

    expect(container.textContent?.match(/string12/g)).toHaveLength(1);
    expect(
      container.querySelector('[aria-label="Rename string12"]')
    ).not.toBeNull();
    expect(
      container.querySelector('[aria-label="Delete string12"]')
    ).not.toBeNull();
  });

  it('aligns an unrestricted dynamic primitive type and control without a repeated input label', () => {
    act(() => {
      root.render(
        <JsonForms
          data={{ dynamicString: 'value' }}
          schema={{
            type: 'object',
            additionalProperties: true,
          }}
          uischema={{ type: 'Control', scope: '#' }}
          renderers={antdRenderers}
        />
      );
    });

    const mixedRow = container.querySelector(
      '.jsonforms-additional-property .jsonforms-mixed-renderer-primitive'
    );
    expect(
      mixedRow?.querySelector('.jsonforms-mixed-renderer-type')
    ).not.toBeNull();
    expect(
      mixedRow?.querySelector('.jsonforms-mixed-renderer-value .ant-input')
    ).not.toBeNull();
    expect(
      mixedRow?.querySelector(
        '.jsonforms-mixed-renderer-value .ant-form-item-label'
      )
    ).toBeNull();
    expect(container.textContent?.match(/dynamicString/g)).toHaveLength(1);
  });

  it.each([
    ['string', 'value', ''],
    ['number', 12.5, 0],
    ['integer', 12, 0],
    ['string', 'value', 'schema default', 'schema default'],
  ] as const)(
    'resets a cleared dynamic %s value to its schema default instead of removing its key',
    async (type, initialValue, expectedValue, defaultValue?) => {
      const handleChange = vi.fn();
      const schema = {
        type,
        ...(defaultValue === undefined ? {} : { default: defaultValue }),
      };

      await act(async () => {
        root.render(
          <InputControl
            data={initialValue}
            enabled
            errors=''
            handleChange={handleChange}
            id='dynamic'
            label='Dynamic'
            path='dynamic'
            rootSchema={schema}
            schema={schema}
            uischema={{
              type: 'Control',
              scope: '#',
              options: { [PRESERVE_DYNAMIC_PROPERTY_OPTION]: true },
            }}
            visible
            input={({ handleChange: clearValue, path }) => (
              <button
                aria-label='Clear dynamic value'
                onClick={() => clearValue(path, undefined)}
                type='button'
              />
            )}
          />
        );
      });

      const clear = container.querySelector<HTMLButtonElement>(
        'button[aria-label="Clear dynamic value"]'
      );
      expect(clear).not.toBeNull();

      await act(async () => {
        clear?.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true })
        );
      });

      expect(handleChange).toHaveBeenCalledWith('dynamic', expectedValue);
    }
  );
});
