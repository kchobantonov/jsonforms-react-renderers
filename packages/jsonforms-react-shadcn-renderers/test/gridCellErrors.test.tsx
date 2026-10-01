import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { expect, it } from 'vitest';
import { ShadcnGridCellFrame } from '../src/cells/asCell';

it('shows scalar grid cell errors and removes them when the value becomes valid', () => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const schema = { type: 'object', properties: { name: { type: 'string', minLength: 1 } } };
  const renderers = [{ tester: () => 10, renderer: () => (
    <ShadcnGridCellFrame schema={schema.properties.name} uischema={{ type: 'Control', scope: '#/properties/name' }} path='name'>
      <span>Editor</span>
    </ShadcnGridCellFrame>
  ) }];
  const render = (name: string) => act(() => root.render(
    <JsonForms schema={schema} data={{ name }} uischema={{ type: 'Control', scope: '#/properties/name' }} renderers={renderers} />
  ));
  try {
    render('');
    expect(container.querySelector('.shadcn-jsonforms-cell-error')).not.toBeNull();
    render('valid');
    expect(container.querySelector('.shadcn-jsonforms-cell-error')).toBeNull();
  } finally {
    act(() => root.unmount());
    container.remove();
  }
});
