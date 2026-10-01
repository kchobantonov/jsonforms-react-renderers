import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms, DispatchCell } from '@jsonforms/react';
import { afterEach, expect, it } from 'vitest';
import { FileControlRenderer } from '../src/renderers/FileControlRenderer';
import { shadcnExtendedCells } from '../src';
let cleanup = () => {};
afterEach(() => cleanup());
const mount = (cell = false, showUnfocusedDescription = false, data = '') => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const schema = {
    type: 'string',
    format: 'binary',
    description: 'Attach a document',
  } as any;
  const uischema = { type: 'Control', scope: '#', label: 'Attachment' } as any;
  const Cell = () => (
    <DispatchCell schema={schema} uischema={uischema} path='' />
  );
  act(() =>
    root.render(
      <JsonForms
        schema={schema}
        uischema={uischema}
        data={data}
        config={{ showUnfocusedDescription }}
        cells={shadcnExtendedCells}
        renderers={[
          { tester: () => 100, renderer: cell ? Cell : FileControlRenderer },
        ]}
      />
    )
  );
  cleanup = () => {
    act(() => root.unmount());
    container.remove();
  };
  return container;
};
it('hides unfocused descriptions by default and shows them on focus', () => {
  const container = mount();
  expect(container.textContent).not.toContain('Attach a document');
  act(() => container.querySelector('button')!.focus());
  expect(container.textContent).toContain('Attach a document');
});
it('shows descriptions when explicitly enabled', () => {
  expect(mount(false, true).textContent).toContain('Attach a document');
});
it('uses a file input without a field label or description in cells', () => {
  const container = mount(true, true);
  expect(container.querySelector('input[type=file]')).not.toBeNull();
  expect(container.textContent).not.toContain('Attach a document');
  expect(container.querySelector('label')).toBeNull();
});

it.each([
  ['data:text/plain;filename=contract.txt;base64,YQ==', 'contract.txt'],
  ['YQ==', 'File attached'],
])('restores the attachment display from persisted data: %s', (data, label) => {
  let container = mount(false, false, data);
  expect(
    (container.querySelector('input[readonly]') as HTMLInputElement).value
  ).toBe(label);
  cleanup();
  container = mount(false, false, data);
  expect(
    (container.querySelector('input[readonly]') as HTMLInputElement).value
  ).toBe(label);
  expect(container.querySelector('input')!.style.display).toBe('none');
  expect(container.querySelector('[aria-label="Clear value"]')).not.toBeNull();
});
