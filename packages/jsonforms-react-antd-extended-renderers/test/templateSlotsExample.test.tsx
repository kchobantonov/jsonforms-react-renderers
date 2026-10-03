import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { expect, it } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import {
  antdRenderers,
  antdCells,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';
import schema from '@chobantonov/jsonforms-extended-spec/examples/template-slots/schema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/template-slots/data.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/template-slots/uischema.json';
// @ts-ignore Trusted example registry.
import { uischemas } from '@chobantonov/jsonforms-extended-spec/examples/template-slots/uischemas.mjs';
it('renders named templates and slot overrides through the native registry', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    await act(async () =>
      root.render(
        <JsonForms
          schema={schema}
          data={data}
          uischema={uischema}
          uischemas={uischemas}
          renderers={[...antdExtendedRenderers, ...antdRenderers]}
          cells={antdCells}
        />
      )
    );
    expect(host.textContent).toContain('Custom heading');
    expect(host.textContent).toContain('Default heading');
    expect(host.textContent).toContain(
      'Local heading overrides inherited heading'
    );
    expect(host.querySelectorAll('input[value="Ada"]')).toHaveLength(2);
    expect(host.querySelector('input[value="ada@example.org"]')).toBeTruthy();
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
