import TextControl, { textControlTester } from '../../src/controls/TextControl';
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
  ),
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

  it('clears a dynamic string without removing its key, and deletes only explicitly', () => {
    const State = () => (
      <output>{JSON.stringify(useJsonForms().core?.data)}</output>
    );
    act(() =>
      root.render(
        <JsonForms
          schema={{ type: 'object', additionalProperties: { type: 'string' } }}
          uischema={{ type: 'Control', scope: '#' }}
          data={{ note: 'hello' }}
          renderers={[
            {
              tester: rankWith(
                5,
                schemaMatches((schema) => schema.type === 'object'),
              ),
              renderer: (props: any) => (
                <>
                  {React.createElement(additionalPropertiesRenderer, props)}
                  <State />
                </>
              ),
            },
            { tester: textControlTester, renderer: TextControl },
          ]}
        >
          <State />
        </JsonForms>,
      ),
    );
    act(() =>
      container
        .querySelector<HTMLButtonElement>('[aria-label="Clear value"]')!
        .click(),
    );
    expect(container.querySelector('output')?.textContent).toBe('{"note":""}');
    expect(
      container.querySelector('[aria-label="Delete note"]'),
    ).not.toBeNull();
    act(() =>
      container
        .querySelector<HTMLButtonElement>('[aria-label="Delete note"]')!
        .click(),
    );
    expect(container.querySelector('output')?.textContent).toBe('{}');
  });

  it('blocks an open rename after the host switches to readonly', () => {
    const handleChange = vi.fn();
    const render = (readonly: boolean) =>
      act(() =>
        root.render(
          <AdditionalProperties
            data={{ note: 'hello' }}
            enabled
            readonly={readonly}
            handleChange={handleChange}
            label='Map'
            path=''
            schema={{
              type: 'object',
              additionalProperties: { type: 'string' },
            }}
            rootSchema={{
              type: 'object',
              additionalProperties: { type: 'string' },
            }}
            uischema={{ type: 'Control', scope: '#' }}
            renderers={[{ tester: textControlTester, renderer: TextControl }]}
          />,
        ),
      );
    render(false);
    act(() =>
      container
        .querySelector<HTMLButtonElement>('[aria-label="Rename note"]')!
        .click(),
    );
    const input = container.querySelector<HTMLInputElement>(
      'input[aria-label="Rename note"]',
    )!;
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(input, 'renamed');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    render(true);
    act(() =>
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      ),
    );
    expect(handleChange).not.toHaveBeenCalled();
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
        />,
      );
    });

    const input = container.querySelector(
      'input[placeholder="Property name"]',
    ) as HTMLInputElement;
    const setInputValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )?.set;

    act(() => {
      setInputValue?.call(input, 'invalid-name');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(
      container.querySelector('.jsonforms-additional-properties-error')
        ?.textContent,
    ).toBe('The property name does not match an allowed pattern.');
    expect(
      (container.querySelector('button') as HTMLButtonElement).disabled,
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
                schemaMatches((candidate) => candidate.type === 'object'),
              ),
              renderer: additionalPropertiesRenderer,
            },
            {
              tester: rankWith(
                100,
                schemaMatches((candidate) => candidate.type === 'string'),
              ),
              renderer: AjvProbe,
            },
          ]}
        />,
      );
    });

    expect(nestedAjv).toBe(ajv);
  });
});
