import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ControlProps } from '@jsonforms/core';
import {
  ShadcnInputControl,
  ShadcnNumberControl,
} from '../src/controls/InputControl';
import { ShadcnTextControl } from '../src/controls/TextControl';
import { ShadcnBooleanControl } from '../src/controls/BooleanControl';
import { ShadcnDateControl } from '../src/controls/DateControl';
import { ShadcnTimeControl } from '../src/controls/TimeControl';
import { ShadcnDateTimeControl } from '../src/controls/DateTimeControl';
import {
  ShadcnBooleanToggleControl,
  ShadcnSliderControl,
} from '../src/controls';
import { renderMarkup } from './render';

const defaults = {
  data: undefined,
  enabled: true,
  visible: true,
  errors: '',
  label: 'Value',
  path: 'value',
  id: 'value',
  schema: { type: 'string' },
  rootSchema: {},
  uischema: { type: 'Control', scope: '#/properties/value' },
  handleChange: vi.fn(),
} as ControlProps;

const controls = [
  ShadcnBooleanToggleControl,
  ShadcnSliderControl,
  ShadcnInputControl,
  ShadcnNumberControl,
  ShadcnTextControl,
  ShadcnBooleanControl,
  ShadcnDateControl,
  ShadcnTimeControl,
  ShadcnDateTimeControl,
];

describe.each(controls)(
  '%s control contract with app components',
  (Control) => {
    it('honors visibility', () =>
      expect(renderMarkup(<Control {...defaults} visible={false} />)).toBe(''));
    it('renders the label', () =>
      expect(renderMarkup(<Control {...defaults} />)).toContain('Value'));
    it('renders required state', () =>
      expect(renderMarkup(<Control {...defaults} required />)).toContain(
        'aria-hidden="true"> *'
      ));
    it('displays descriptions', () =>
      expect(
        renderMarkup(
          <Control
            {...defaults}
            description='Instructions'
            config={{ showUnfocusedDescription: true }}
          />
        )
      ).toContain('Instructions'));
    it('displays validation errors', () =>
      expect(
        renderMarkup(<Control {...defaults} errors='Invalid value' />)
      ).toContain('Invalid value'));
    it('disables its input', () =>
      expect(renderMarkup(<Control {...defaults} enabled={false} />)).toContain(
        'disabled'
      ));
  }
);

describe('editable app-owned controls', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });
  const change = (value: string) => {
    const input = container.querySelector('input,textarea')!;
    const prototype =
      input.tagName === 'TEXTAREA'
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    act(() => {
      Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(
        input,
        value
      );
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };
  it.each(['Ada', '0', '<markup>', 'a\nb', ''])(
    'preserves string data %j',
    (value) => {
      const handleChange = vi.fn();
      act(() =>
        root.render(
          <ShadcnTextControl
            {...defaults}
            data='previous'
            handleChange={handleChange}
            uischema={{ ...defaults.uischema, options: { multi: true } }}
          />
        )
      );
      change(value);
      expect(handleChange).toHaveBeenLastCalledWith(
        'value',
        value || undefined
      );
    }
  );
  it.each([
    ['0', 0],
    ['1e2', 100],
    ['-2', -2],
    ['1.25', 1.25],
    ['', undefined],
  ])('preserves numeric type for %j', (value, expected) => {
    const handleChange = vi.fn();
    act(() =>
      root.render(
        <ShadcnNumberControl
          {...defaults}
          handleChange={handleChange}
          data={99}
        />
      )
    );
    change(value as string);
    expect(handleChange).toHaveBeenLastCalledWith('value', expected);
  });
  it.each([
    ['1e2', 100],
    ['1.9', 1],
  ])('preserves integer semantics for %s', (value, expected) => {
    const handleChange = vi.fn();
    act(() =>
      root.render(
        <ShadcnNumberControl
          {...defaults}
          integer
          data={8}
          handleChange={handleChange}
        />
      )
    );
    change(value as string);
    expect(handleChange).toHaveBeenLastCalledWith('value', expected);
  });
  it.each(controls)('honors readonly for %s', (Control) => {
    act(() => root.render(<Control {...defaults} readonly />));
    expect(
      Boolean(container.querySelector('[disabled], [data-disabled]'))
    ).toBe(true);
  });
  it('clears a populated field through the app button', () => {
    const handleChange = vi.fn();
    act(() =>
      root.render(
        <ShadcnInputControl
          {...defaults}
          data='Ada'
          handleChange={handleChange}
        />
      )
    );
    act(() =>
      (
        container.querySelector(
          '[aria-label="Clear value"]'
        ) as HTMLButtonElement
      ).click()
    );
    expect(handleChange).toHaveBeenCalledWith('value', undefined);
  });
  it('updates booleans through the app checkbox', () => {
    const handleChange = vi.fn();
    act(() =>
      root.render(
        <ShadcnBooleanControl
          {...defaults}
          data={false}
          handleChange={handleChange}
        />
      )
    );
    act(() =>
      (
        container.querySelector('[role="checkbox"]') as HTMLButtonElement
      ).click()
    );
    expect(handleChange).toHaveBeenCalledWith('value', true);
  });
  it('associates validation feedback with the input', () => {
    act(() =>
      root.render(<ShadcnInputControl {...defaults} errors='Required' />)
    );
    const input = container.querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(
      document.getElementById(input.getAttribute('aria-describedby')!)
        ?.textContent
    ).toBe('Required');
  });
});
