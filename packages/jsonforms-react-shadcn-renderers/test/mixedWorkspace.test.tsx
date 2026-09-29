import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers, shadcnCells } from '../src';

it('renders structured mixed values in a collapsible workspace and navigates nested values', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: ['object', 'null'],
            properties: {
              child: {
                type: ['object', 'string'],
                properties: { name: { type: 'string' } },
              },
            },
          }}
          uischema={{ type: 'Control', scope: '#', label: 'Mixed' }}
          data={{ child: { name: 'Keep' } }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    expect(container.querySelector('details,fieldset')).toBeNull();
    expect(
      container.querySelectorAll('[aria-label="Value structure"]')
    ).toHaveLength(1);
    const toggle = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Mixed"][aria-expanded]'
    )!;
    expect(toggle).toBeTruthy();
    const primitives = container.querySelector<HTMLButtonElement>(
      'nav button[aria-label="Show primitives"]'
    )!;
    expect(primitives).toBeTruthy();
    act(() => primitives.click());
    expect(
      container.querySelector('nav button[aria-label="Hide primitives"]')
    ).toBeTruthy();
    const input = container.querySelector('[aria-label="Search value tree"]');
    act(() => toggle.click());
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    act(() => toggle.click());
    expect(container.querySelector('[aria-label="Search value tree"]')).toBe(
      input
    );
    const branches = Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        'nav[aria-label="Value structure"] button[aria-expanded]'
      )
    );
    expect(branches.length).toBeGreaterThan(0);
    expect(
      branches.every(
        (branch) => branch.getAttribute('aria-expanded') === 'false'
      )
    ).toBe(true);
    act(() => branches[0].click());
    expect(branches[0].getAttribute('aria-expanded')).toBe('true');
    expect(branches[1].getAttribute('aria-expanded')).toBe('false');
    const child = Array.from(
      container.querySelectorAll<HTMLButtonElement>(
        'nav[aria-label="Value structure"] button'
      )
    ).find(
      (button) =>
        button.textContent?.includes('child') &&
        button.hasAttribute('aria-pressed')
    )!;
    act(() => child.click());
    expect(
      container.querySelector('nav[aria-label="Value path"]')?.textContent
    ).toContain('child');
    expect(
      container.querySelector<HTMLInputElement>('input[value="Keep"]')
    ).toBeTruthy();
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

it('renders scalar type selection beside its editor', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={{ type: ['string', 'null'] }}
          uischema={{ type: 'Control', scope: '#', label: 'Value' }}
          data='Text'
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    const row = container.querySelector('.jsonforms-mixed-renderer-primitive');
    expect(row?.querySelector('[role="combobox"]')).toBeTruthy();
    expect(row?.querySelector('input')?.value).toBe('Text');
  } finally {
    act(() => root.unmount());
  }
});

it('confirms clearing a populated object and preserves it on cancellation', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: ['object', 'null'],
            properties: { name: { type: 'string' } },
          }}
          uischema={{ type: 'Control', scope: '#' }}
          data={{ name: 'Keep' }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    act(() =>
      container
        .querySelector<HTMLButtonElement>('[aria-label="Clear type"]')!
        .click()
    );
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog).toBeTruthy();
    const cancel = Array.from(dialog.querySelectorAll('button')).find(
      (b) => b.textContent === 'No'
    )!;
    act(() => cancel.click());
    expect(
      container.querySelector('[aria-label="Value structure"]')
    ).toBeTruthy();
    expect(container.querySelector('input[value="Keep"]')).toBeTruthy();
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});

it('validates tree renames inline and allows cancellation', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        <JsonForms
          schema={{
            type: ['object', 'null'],
            additionalProperties: { type: 'object' },
            propertyNames: { minLength: 3 },
          }}
          uischema={{ type: 'Control', scope: '#' }}
          data={{ first: {}, second: {} }}
          renderers={shadcnRenderers}
          cells={shadcnCells}
        />
      )
    );
    act(() =>
      container
        .querySelector<HTMLButtonElement>(
          'nav[aria-label="Value structure"] button[aria-expanded]'
        )!
        .click()
    );
    const rename = container.querySelector<HTMLButtonElement>(
      'nav button[aria-label="Rename first"]'
    )!;
    expect(rename).toBeTruthy();
    act(() => rename.click());
    const input = container.querySelector<HTMLInputElement>(
      'nav input[aria-label="Property name"]'
    )!;
    const change = (value: string) =>
      act(() => {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )!.set!.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    change('second');
    expect(
      container.querySelector('nav [role="alert"]')?.textContent
    ).toContain('already defined');
    act(() =>
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      )
    );
    expect(container.querySelector('nav input')).toBe(input);
    change('x');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    act(() =>
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      )
    );
    expect(container.querySelector('nav input')).toBeNull();
    expect(
      container.querySelector('nav button[aria-label="Rename first"]')
    ).toBeTruthy();
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
