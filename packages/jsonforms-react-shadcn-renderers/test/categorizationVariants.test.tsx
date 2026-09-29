import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnRenderers } from '../src';
const categories = ['First', 'Second', 'Third'].map((label, index) => ({
  type: 'Category',
  label,
  name: label.toLowerCase(),
  elements: [{ type: 'Control', scope: `#/properties/value${index}` }],
}));
const schema = {
  type: 'object',
  properties: {
    value0: { type: 'string' },
    value1: { type: 'string' },
    value2: { type: 'string' },
    hide: { type: 'boolean' },
  },
};
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const draw = (
  variant: string,
  options: any = {},
  elements: any = categories,
  data: any = {}
) =>
  act(() =>
    root.render(
      <JsonForms
        schema={schema as any}
        data={data}
        uischema={
          {
            type: 'Categorization',
            options: { variant, ...options },
            elements,
          } as any
        }
        renderers={shadcnRenderers}
      />
    )
  );
const buttons = () => Array.from(container.querySelectorAll('button'));
const click = (name: string) =>
  act(() =>
    buttons()
      .find((b) => b.textContent!.includes(name))!
      .click()
  );
const open = () =>
  Array.from(container.querySelectorAll<HTMLElement>('[role="region"]')).filter(
    (el) => !el.hidden
  );
it('renders accordion disclosures instead of tabs and honors initial by name', () => {
  draw('accordion', { initial: 'second' });
  expect(container.querySelector('[role="tablist"]')).toBeNull();
  const button = buttons().find((b) => b.textContent === 'Second')!;
  expect(button.getAttribute('aria-expanded')).toBe('true');
  expect(open()).toHaveLength(1);
  expect(open()[0].id).toBe(button.getAttribute('aria-controls'));
  expect(open()[0].getAttribute('aria-labelledby')).toBe(button.id);
});
it('opens only one accordion panel and permits closing all', () => {
  draw('accordion');
  click('Second');
  expect(open()).toHaveLength(1);
  click('Second');
  expect(open()).toHaveLength(0);
});
it('keeps closed panels mounted', () => {
  draw('accordion');
  const input = container.querySelector('input');
  click('Second');
  expect(container.querySelector('input')).toBe(input);
  expect(container.querySelectorAll('input')).toHaveLength(3);
});
it('preserves closed state through data updates', () => {
  draw('accordion');
  click('First');
  draw('accordion', {}, categories, { value0: 'Changed' });
  expect(open()).toHaveLength(0);
});
it.each(['accordion', 'stepper'])(
  'preserves selected identity on reorder: %s',
  (variant) => {
    draw(variant);
    click('Second');
    draw(variant, {}, [categories[2], categories[0], categories[1]]);
    expect(open()[0].querySelector('input')!.id).toContain('value1');
  }
);
it.each(['accordion', 'stepper'])(
  'honors category visibility and recovers selection: %s',
  (variant) => {
    const elements = [
      categories[0],
      {
        ...categories[1],
        rule: {
          effect: 'HIDE',
          condition: { scope: '#/properties/hide', schema: { const: true } },
        },
      },
    ];
    draw(variant, {}, elements, { hide: false });
    click('Second');
    draw(variant, {}, elements, { hide: true });
    expect(buttons().some((b) => b.textContent!.includes('Second'))).toBe(
      false
    );
    expect(open()).toHaveLength(1);
    expect(open()[0].querySelector('input')!.id).toContain('value0');
  }
);
it('stepper navigates with Previous/Next and stops at boundaries', () => {
  draw('stepper', { showNavButtons: true });
  expect(buttons().find((b) => b.textContent === 'Previous')!.disabled).toBe(
    true
  );
  click('Next');
  expect(
    container.querySelector('[aria-current="step"]')!.textContent
  ).toContain('Second');
  click('Next');
  expect(buttons().find((b) => b.textContent === 'Next')!.disabled).toBe(true);
  click('Previous');
  expect(open()[0].querySelector('input')!.id).toContain('value1');
});
it('shows no stepper navigation by default', () => {
  draw('stepper');
  expect(buttons().some((b) => b.textContent === 'Next')).toBe(false);
});
it('ignores stepper options in accordion', () => {
  draw('accordion', { showNavButtons: true, vertical: true });
  expect(buttons()).toHaveLength(3);
});
it.each(['accordion', 'stepper'])(
  'handles no visible categories: %s',
  (variant) => {
    draw(
      variant,
      {},
      categories.map((c) => ({
        ...c,
        rule: { effect: 'HIDE', condition: { scope: '#', schema: {} } },
      }))
    );
    expect(container.querySelector('input')).toBeNull();
    expect(container.querySelector('[aria-current]')).toBeNull();
  }
);
it('unknown variants retain the tabs fallback', () => {
  draw('unknown');
  expect(container.querySelector('[role="tablist"]')).toBeTruthy();
});
it('falls back with a diagnostic when initial names no category', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    draw('accordion', { initial: 'missing' });
    expect(open()[0].querySelector('input')!.id).toContain('value0');
    expect(warn).toHaveBeenCalled();
  } finally {
    warn.mockRestore();
  }
});
it.each(['accordion', 'stepper'])(
  'allows readonly navigation while keeping controls disabled: %s',
  (variant) => {
    act(() =>
      root.render(
        <JsonForms
          schema={schema as any}
          data={{}}
          readonly
          uischema={
            {
              type: 'Categorization',
              options: { variant },
              elements: categories,
            } as any
          }
          renderers={shadcnRenderers}
        />
      )
    );
    click('Second');
    expect(open()[0].querySelector('input')!.disabled).toBe(true);
  }
);
