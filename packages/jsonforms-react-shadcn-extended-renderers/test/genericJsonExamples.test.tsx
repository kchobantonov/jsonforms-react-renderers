import '../../jsonforms-react-shadcn-renderers/test/setup';
import {
  NullControlRenderer as NullRenderer,
  nullControlTester as nullTester,
} from '../../jsonforms-react-shadcn-extended-renderers/src/renderers/NullControlRenderer';
import { demoSchema } from '../../jsonforms-react-demo-common/src/app/demoSchema';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { examples } from '@chobantonov/jsonforms-extended-spec/examples';
import {
  shadcnRenderers,
  shadcnCells,
} from '../../jsonforms-react-shadcn-renderers/src';

it.each(['json-editor', 'json-inference'])(
  'renders %s from an absent value through pasted JSON',
  async (id) => {
    const example = examples.find((e) => e.id === id)!;
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const render = (data: any) => (
      <JsonForms
        schema={demoSchema(example.schema, data)}
        uischema={example.uischema}
        data={data}
        renderers={[
          ...shadcnRenderers,
          { tester: nullTester, renderer: NullRenderer },
        ]}
        cells={shadcnCells}
      />
    );
    try {
      await act(async () => root.render(render(undefined)));
      expect(host.textContent).not.toContain('No applicable');
      if (id === 'json-editor')
        expect(host.querySelector('[role="combobox"]')).not.toBeNull();
      await act(async () =>
        root.render(render({ name: 'Pasted', active: true }))
      );
      expect(host.textContent).not.toContain('No applicable');
      if (id === 'json-inference')
        expect(
          Array.from(host.querySelectorAll('input')).some(
            (input) => input.value === 'Pasted'
          )
        ).toBe(true);
      for (const data of [[1, 'two', false, null], 'text', 2, true, null]) {
        await act(async () => root.render(render(data)));
        expect(host.textContent).not.toContain('No applicable');
      }
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  }
);
