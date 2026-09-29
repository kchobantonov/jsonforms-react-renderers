import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  ShadcnTextCell,
  ShadcnNumberCell,
  ShadcnBooleanCell,
  ShadcnEnumCell,
  shadcnCells,
} from '../src/cells';
import { renderMarkup } from './render';

const props = {
  visible: true,
  enabled: true,
  id: 'cell',
  path: 'items.0.value',
  schema: { type: 'string' },
  uischema: { type: 'Control', scope: '#' },
  handleChange: vi.fn(),
} as any;

describe.each([
  ShadcnTextCell,
  ShadcnNumberCell,
  ShadcnBooleanCell,
  ShadcnEnumCell,
])('%s cell', (Cell) => {
  it('is editable', () =>
    expect(renderMarkup(<Cell {...props} />)).toMatch(/<input|<button/));
  it('honors visibility', () =>
    expect(renderMarkup(<Cell {...props} visible={false} />)).toBe(''));
  it('honors disabled state', () =>
    expect(renderMarkup(<Cell {...props} enabled={false} />)).toContain(
      'disabled'
    ));
  it('exposes validation state', () =>
    expect(renderMarkup(<Cell {...props} errors='Invalid' />)).toContain(
      'aria-invalid="true"'
    ));
  it('has an accessible name', () =>
    expect(renderMarkup(<Cell {...props} />)).toContain(
      'aria-label="items.0.value"'
    ));
});

describe('cell edits', () => {
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
  it.each([
    ['number', '0', 0],
    ['number', '1.5', 1.5],
    ['integer', '1.5', 1],
    ['number', '', undefined],
  ])('writes %s %j as %j', (type, value, expected) => {
    const handleChange = vi.fn();
    act(() =>
      root.render(
        <ShadcnNumberCell
          {...props}
          schema={{ type }}
          data={7}
          handleChange={handleChange}
        />
      )
    );
    const input = container.querySelector('input')!;
    act(() => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value'
      )!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(handleChange).toHaveBeenLastCalledWith('items.0.value', expected);
  });
  it.each(['string', 'number', 'integer', 'boolean'])(
    'registers a cell for %s',
    (type) => {
      expect(
        shadcnCells.some(
          ({ tester }) =>
            tester(props.uischema, { type } as any, {
              rootSchema: {},
              config: {},
            }) >= 0
        )
      ).toBe(true);
    }
  );
  it.each([undefined, null, 'false', 0, {}, []])(
    'does not present invalid boolean %j as an answer',
    (data) => {
      expect(
        renderMarkup(<ShadcnBooleanCell {...props} data={data} />)
      ).toContain('data-state="indeterminate"');
    }
  );
});
