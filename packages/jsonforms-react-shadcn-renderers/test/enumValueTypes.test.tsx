import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ShadcnEnumControl } from '../src/controls/EnumControl';

// Isolate the value adapter from Radix's portal interaction. Other suites render
// the actual app Select. The renderer must pass opaque IDs to either component.
vi.mock('@jsonforms-react-shadcn-ui/select', () => ({
  Select: ({ value, onValueChange, disabled, children }: any) => (
    <select
      disabled={disabled}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
}));

describe('enum values keep their JSON types', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement('div');
    root = createRoot(container);
  });
  afterEach(() => act(() => root.unmount()));
  const values = [0, 1, false, true, '', '0', 'false', null];
  it.each(values)('returns the original value %j', (value) => {
    const handleChange = vi.fn();
    act(() =>
      root.render(
        <ShadcnEnumControl
          {...({
            visible: true,
            enabled: true,
            data: 'missing',
            path: 'choice',
            uischema: { type: 'Control', scope: '#' },
            options: values.map((value) => ({
              value,
              label: JSON.stringify(value),
            })),
            handleChange,
          } as any)}
        />
      )
    );
    const select = container.querySelector('select')!;
    act(() => {
      select.value = `option-${values.indexOf(value)}`;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(handleChange).toHaveBeenLastCalledWith('choice', value);
  });
  it.each(values)('uses a nonempty unique UI token for %j', (value) => {
    act(() =>
      root.render(
        <ShadcnEnumControl
          {...({
            visible: true,
            enabled: true,
            data: value,
            path: 'choice',
            uischema: { type: 'Control', scope: '#' },
            options: values.map((value) => ({
              value,
              label: JSON.stringify(value),
            })),
            handleChange: vi.fn(),
          } as any)}
        />
      )
    );
    expect(container.querySelector('select')!.value).toBe(
      `option-${values.indexOf(value)}`
    );
    expect(
      new Set(
        Array.from(container.querySelectorAll('option')).map(
          (option) => option.value
        )
      ).size
    ).toBe(values.length);
  });
});
