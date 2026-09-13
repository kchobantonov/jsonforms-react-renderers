import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { createAjv, JsonSchema } from '@jsonforms/core';
import { materialRenderers } from '@jsonforms/material-renderers';
import { vi } from 'vitest';
import { muiExtendedRenderers } from '../src';
import {
  parseExtendedDuration,
  formatExtendedDuration,
  colorPickerValue,
  decodeEditorValue,
} from '@chobantonov/jsonforms-react-extended-renderers';

const mocks = vi.hoisted(() => ({ editor: null as any, grid: null as any }));
vi.mock('@monaco-editor/react', () => ({
  default: (props: any) => {
    mocks.editor = props;
    return <div data-editor />;
  },
}));
vi.mock('ag-grid-react', () => ({
  AgGridReact: (props: any) => {
    mocks.grid = props;
    return <div data-grid />;
  },
}));

const mount = async (
  schema: JsonSchema,
  data: any,
  options = {},
  readonly = false
) => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const changes = vi.fn();
  const ajv = createAjv({ strict: false });
  await act(async () =>
    root.render(
      <JsonForms
        schema={schema}
        uischema={{ type: 'Control', scope: '#', options }}
        data={data}
        readonly={readonly}
        ajv={ajv}
        renderers={[...materialRenderers, ...muiExtendedRenderers]}
        onChange={changes}
      />
    )
  );
  return {
    container,
    changes,
    cleanup: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
};
const click = async (label: string) =>
  act(async () => {
    const button = [...document.querySelectorAll('button')].find(
      (element) =>
        element.getAttribute('aria-label') === label ||
        element.textContent === label
    );
    expect(button).toBeDefined();
    button!.click();
  });

describe('extended control helpers', () => {
  it.each(['P2W', 'P2DT3H', 'P0D', 'PT59S'])('round trips %s', (value) =>
    expect(formatExtendedDuration(parseExtendedDuration(value)!)).toBe(value)
  );
  it.each(['P', 'PT', 'P1DT', 'P1W2D', '-P1D'])(
    'rejects malformed duration %s',
    (value) => expect(parseExtendedDuration(value)).toBeNull()
  );
  it('normalizes picker swatches without altering text data', () => {
    expect(colorPickerValue('#abc')).toBe('#aabbcc');
    expect(colorPickerValue('#123456ff')).toBe('#123456');
  });
  it('does not turn invalid JSON into a data update', () =>
    expect(decodeEditorValue('{', true).valid).toBe(false));
});

describe('MUI extended registry', () => {
  it('renders a color picker and clears the data', async () => {
    const view = await mount({ type: 'string', format: 'color' }, '#abc');
    try {
      expect(
        view.container.querySelector<HTMLInputElement>('input[type=color]')!
          .value
      ).toBe('#aabbcc');
      await click('Clear value');
      expect(view.changes.mock.calls.at(-1)?.[0].data).toBeUndefined();
    } finally {
      await view.cleanup();
    }
  });
  it('distinguishes null from an absent value', async () => {
    const view = await mount({ type: 'null' }, null);
    try {
      const checkbox = view.container.querySelector<HTMLInputElement>(
        'input[type=checkbox]'
      )!;
      expect(checkbox.checked).toBe(true);
      await act(async () => checkbox.click());
      expect(view.changes.mock.calls.at(-1)?.[0].data).toBeUndefined();
    } finally {
      await view.cleanup();
    }
  });
  it('cancels duration drafts and commits only on confirmation', async () => {
    const view = await mount({ type: 'string', format: 'duration' }, 'P2W', {
      okLabel: 'Save duration',
    });
    try {
      await click('Edit duration');
      const weeks =
        document.querySelector<HTMLInputElement>('input[type=number]')!;
      expect(weeks.value).toBe('2');
      await act(async () => {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )!.set!.call(weeks, '3');
        weeks.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await click('Cancel');
      expect(
        view.container.querySelector<HTMLInputElement>('input')!.value
      ).toBe('P2W');
      await click('Edit duration');
      expect(
        document.querySelector<HTMLInputElement>('input[type=number]')!.value
      ).toBe('2');
      await click('Save duration');
      expect(view.changes.mock.calls.at(-1)?.[0].data).toBe('P2W');
    } finally {
      await view.cleanup();
    }
  });
  it('applies duration components immediately when confirmation is disabled', async () => {
    const view = await mount({ type: 'string', format: 'duration' }, 'P2W', {
      showActions: false,
    });
    try {
      await click('Edit duration');
      const weeks =
        document.querySelector<HTMLInputElement>('input[type=number]')!;
      await act(async () => {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )!.set!.call(weeks, '3');
        weeks.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await vi.waitFor(() =>
        expect(view.changes.mock.calls.at(-1)?.[0].data).toBe('P3W')
      );
      expect(
        [...document.querySelectorAll('button')].some(
          (button) => button.textContent === 'OK'
        )
      ).toBe(false);
    } finally {
      await view.cleanup();
    }
  });
  it('keeps readonly controls immutable', async () => {
    const view = await mount(
      { type: 'string', format: 'duration' },
      'P1D',
      {},
      true
    );
    try {
      expect(
        view.container.querySelector<HTMLButtonElement>(
          '[aria-label="Edit duration"]'
        )!.disabled
      ).toBe(true);
      expect(
        view.container.querySelector('[aria-label="Clear value"]')
      ).toBeNull();
    } finally {
      await view.cleanup();
    }
  });
  it('preserves structured JSON during invalid Monaco edits', async () => {
    const view = await mount(
      { type: 'object' },
      { a: 1 },
      { format: 'code', language: 'json', convertJson: true }
    );
    try {
      expect(mocks.editor.value).toContain('"a": 1');
      await act(async () => mocks.editor.onChange('{'));
      expect(mocks.editor.value).toBe('{');
      expect(view.container.textContent).toContain('Enter valid JSON.');
      await act(async () => mocks.editor.onChange('{"b":2}'));
      await vi.waitFor(() =>
        expect(view.changes.mock.calls.at(-1)?.[0].data).toEqual({ b: 2 })
      );
    } finally {
      await view.cleanup();
    }
  });
  it('edits grid data without mutating rows or reserving user property names', async () => {
    const original = [{ __jsonformsIndex: 'user value', name: 'Before' }];
    const view = await mount(
      {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      original,
      { variant: 'ag-grid' }
    );
    try {
      await act(async () =>
        mocks.grid.onCellEditRequest({
          data: { index: 0 },
          column: { getColId: () => 'name' },
          newValue: 'After',
        })
      );
      expect(original[0].name).toBe('Before');
      await vi.waitFor(() =>
        expect(view.changes.mock.calls.at(-1)?.[0].data).toEqual([
          { __jsonformsIndex: 'user value', name: 'After' },
        ])
      );
    } finally {
      await view.cleanup();
    }
  });
});
