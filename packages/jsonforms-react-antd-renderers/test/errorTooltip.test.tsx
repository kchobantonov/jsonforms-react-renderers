import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { JsonForms } from '@jsonforms/react';
import { antdRenderers, antdCells } from '../src';
import { CellModeProvider } from '../src/util/cellMode';

const schema = {
  type: 'object',
  properties: { name: { type: 'string', minLength: 5 } },
  required: ['name'],
};
const uischema = {
  type: 'Control',
  scope: '#/properties/name',
  label: 'Full name',
};

const render = (cell: boolean) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const form = (
    <JsonForms
      data={{ name: 'ab' }}
      schema={schema as any}
      uischema={uischema as any}
      renderers={antdRenderers}
      cells={antdCells}
      onChange={() => undefined}
    />
  );
  act(() =>
    root.render(cell ? <CellModeProvider>{form}</CellModeProvider> : form)
  );
  return { container, unmount: () => act(() => root.unmount()) };
};

describe('validation feedback icon', () => {
  it.each([
    ['in a cell', true],
    ['outside a cell', false],
  ])('renders a hoverable error icon %s', (_label, cell) => {
    const { container, unmount } = render(cell as boolean);
    const icon = container.querySelector<HTMLElement>(
      '.anticon-exclamation-circle'
    );
    expect(icon).toBeTruthy();
    // antd's feedback slot is pointer-events: none; without opting back in the
    // icon never receives hover and the tooltip can never open.
    expect(icon!.style.pointerEvents).toBe('auto');
    // antd attaches the tooltip trigger to the icon itself
    act(() => {
      icon!.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    });
    unmount();
  });

  it('shows no feedback icon when valid', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <JsonForms
          data={{ name: 'valid name' }}
          schema={schema as any}
          uischema={uischema as any}
          renderers={antdRenderers}
          cells={antdCells}
          onChange={() => undefined}
        />
      )
    );
    expect(container.querySelector('.anticon-exclamation-circle')).toBeNull();
    act(() => root.unmount());
  });
});
