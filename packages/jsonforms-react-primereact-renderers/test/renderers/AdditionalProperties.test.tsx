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
});
