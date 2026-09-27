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
  const html = container.innerHTML;
  act(() => root.unmount());
  return html;
};

describe('cell mode', () => {
  // The same control renderer is reused inside table cells - there is no
  // separate cell copy - so these assertions pin the two behaviours apart.
  it('shows label and inline message outside a cell', () => {
    const html = render(false);
    expect(html).toContain('Full name');
    expect(html).toContain('ant-form-item-explain');
  });

  it('drops the label and inline message inside a cell', () => {
    const html = render(true);
    expect(html).not.toContain('Full name');
    expect(html).not.toContain('ant-form-item-explain');
  });

  it('keeps the error state inside a cell', () => {
    expect(render(true)).toContain('ant-form-item-has-error');
  });
});
