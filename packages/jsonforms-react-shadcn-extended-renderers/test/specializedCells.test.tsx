import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import {
  shadcnCells,
  shadcnRenderers,
  ShadcnGridCellFrame,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { shadcnExtendedCells, shadcnExtendedRenderers } from '../src';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
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
const cells = [...shadcnExtendedCells, ...shadcnCells];
const draw = (format: string, value: string, onChange = vi.fn()) =>
  act(() =>
    root.render(
      <JsonForms
        schema={{
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: { value: { type: 'string', format } },
              },
            },
          },
        }}
        data={{ rows: [{ value }] }}
        uischema={
          {
            type: 'Control',
            scope: '#/properties/rows',
            options: { table: true },
          } as any
        }
        renderers={[...shadcnExtendedRenderers, ...shadcnRenderers]}
        cells={cells}
        onChange={onChange}
      />
    )
  );
it.each([
  ['date', '2026-07-18'],
  ['time', '09:30:00Z'],
  ['date-time', '2026-07-18T09:30:00Z'],
  ['color', '#112233'],
  ['duration', 'PT2H'],
  ['cron', '0 0 9 * * *'],
])('selects and renders specialized %s cells', (format, value) => {
  const ui = { type: 'Control', scope: '#' } as any;
  const schema = { type: 'string', format } as any;
  expect(
    Math.max(
      ...cells.map((entry) =>
        entry.tester(ui, schema, { rootSchema: schema, config: {} })
      )
    )
  ).toBeGreaterThan(1);
  draw(format, value);
  expect(container.querySelector('.shadcn-jsonforms-cell')).toBeTruthy();
  expect(container.querySelector('td label')).toBeNull();
  expect(container.textContent).not.toContain('No applicable cell');
  if (format === 'color')
    expect(container.querySelector('input[type="color"]')).toBeTruthy();
  if (format === 'duration')
    expect(
      container.querySelector('[aria-label="Choose a duration"]')
    ).toBeTruthy();
  if (format === 'cron')
    expect(
      container.querySelector('[aria-label="Choose a schedule"]')
    ).toBeTruthy();
});
it.each([
  ['duration', 'PT2H', 'PT3H'],
  ['cron', '0 0 9 * * *', '0 0 10 * * *'],
  ['color', '#112233', '#445566'],
])('writes %s edits to the existing row field', (format, value, next) => {
  vi.useFakeTimers();
  try {
    const onChange = vi.fn();
    draw(format, value, onChange);
    const input = container.querySelector<HTMLInputElement>(
      'td input:not([type="color"])'
    )!;
    expect(input.value).toBe(value);
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, next);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => vi.advanceTimersByTime(50));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { rows: [{ value: next }] } })
    );
  } finally {
    vi.useRealTimers();
  }
});
it('centers short controls within the full grid row height', () => {
  act(() =>
    root.render(
      <ShadcnGridCellFrame>
        <button role='checkbox' />
      </ShadcnGridCellFrame>
    )
  );
  const frame = container.firstElementChild as HTMLElement;
  expect(frame.style.display).toBe('flex');
  expect(frame.style.alignItems).toBe('center');
  expect(frame.style.height).toBe('100%');
});
