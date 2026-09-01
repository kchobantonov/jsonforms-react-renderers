import {
  ControlElement,
  ControlProps,
  rankWith,
  schemaMatches,
} from '@jsonforms/core';
import {
  JsonForms,
  withJsonFormsControlProps,
} from '@jsonforms/react';
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
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

const TextRenderer = ({ data, label }: ControlProps) => (
  <label>
    {label}
    <input readOnly value={data ?? ''} />
  </label>
);

const schema = {
  type: 'object',
  additionalProperties: {
    type: 'string',
    title: 'Additional Properties',
  },
};

const renderers = [
  {
    tester: rankWith(10, schemaMatches((candidate) => candidate.type === 'object')),
    renderer: additionalPropertiesRenderer,
  },
  {
    tester: rankWith(10, schemaMatches((candidate) => candidate.type === 'string')),
    renderer: TextRenderer,
  },
];

describe('Shadcn AdditionalProperties', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('matches the compact Shadcn card and icon-action layout', () => {
    act(() => {
      root.render(
        <JsonForms
          data={{ string: 'string value' }}
          schema={schema}
          uischema={{ type: 'Control', scope: '#/' }}
          renderers={renderers}
        />
      );
    });

    const card = container.querySelector('.jsonforms-additional-properties');
    expect(card?.className).toContain('rounded-lg');
    expect(card?.textContent).toContain('Additional Properties');
    expect(card?.textContent).toContain('Property Name');
    expect(container.querySelector('button[aria-label="Add property"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Rename string"]')).not.toBeNull();
    expect(container.querySelector('button[aria-label="Delete string"]')).not.toBeNull();
    expect(card?.textContent).not.toContain('Delete');
  });

  it('opens property renaming in a Shadcn dialog', () => {
    act(() => {
      root.render(
        <JsonForms
          data={{ string: 'string value' }}
          schema={schema}
          uischema={{ type: 'Control', scope: '#/' }}
          renderers={renderers}
        />
      );
    });

    act(() => {
      container
        .querySelector<HTMLButtonElement>('button[aria-label="Rename string"]')
        ?.click();
    });

    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.body.textContent).toContain('Rename property');
    expect(
      document.body.querySelector<HTMLInputElement>('#shadcn-rename-property')
        ?.value
    ).toBe('string');
  });

  it('renames a property from the Shadcn dialog', () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(
        <AdditionalProperties
          data={{ string: 'string value' }}
          enabled
          handleChange={handleChange}
          label='Object'
          path=''
          renderers={renderers}
          rootSchema={schema}
          schema={schema}
          uischema={{ type: 'Control', scope: '#/' }}
        />
      );
    });
    act(() => {
      container
        .querySelector<HTMLButtonElement>('button[aria-label="Rename string"]')
        ?.click();
    });

    const renameInput = document.body.querySelector<HTMLInputElement>(
      '#shadcn-rename-property'
    );
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set;
    act(() => {
      valueSetter?.call(renameInput, 'renamed');
      renameInput?.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => {
      document.body
        .querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.click();
    });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][1]).toEqual({ renamed: 'string value' });
  });

  it('adds properties through the icon action', () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(
        <AdditionalProperties
          data={{}}
          enabled
          handleChange={handleChange}
          label='Object'
          path=''
          rootSchema={schema}
          schema={schema}
          uischema={{ type: 'Control', scope: '#/' }}
        />
      );
    });

    const nameInput = container.querySelector<HTMLInputElement>(
      '#shadcn-additional-property-name'
    );
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )?.set;
    act(() => {
      valueSetter?.call(nameInput, 'newProperty');
      nameInput?.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const addButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Add property"]'
    );
    expect(nameInput?.value).toBe('newProperty');
    expect(addButton?.disabled).toBe(false);
    act(() => {
      addButton?.click();
    });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][1]).toHaveProperty('newProperty');
  });

  it('deletes properties through the icon action', () => {
    const handleChange = vi.fn();
    act(() => {
      root.render(
        <AdditionalProperties
          data={{ string: 'string value' }}
          enabled
          handleChange={handleChange}
          label='Object'
          path=''
          renderers={renderers}
          rootSchema={schema}
          schema={schema}
          uischema={{ type: 'Control', scope: '#/' }}
        />
      );
    });

    act(() => {
      container
        .querySelector<HTMLButtonElement>('button[aria-label="Delete string"]')
        ?.click();
    });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][1]).not.toHaveProperty('string');
  });
});
