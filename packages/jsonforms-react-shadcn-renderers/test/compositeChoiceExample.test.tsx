import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { expect, it } from 'vitest';
import { shadcnRenderers, shadcnCells } from '../src';
import schema from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/schema.json';
import data from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/data.json';
import ui from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/uischema.json';
it('keeps composite choices selected in the spec fixture after JSON reload', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    const category = ui.elements[0].elements.find(
      (c) => c.i18n === 'compositeChoices.navigation'
    ) as any;
    for (let reload = 0; reload < 2; reload++) {
      await act(async () =>
        root.render(
          <JsonForms
            schema={schema as any}
            data={JSON.parse(JSON.stringify(data))}
            uischema={category.elements[0]}
            renderers={shadcnRenderers}
            cells={shadcnCells}
          />
        )
      );
      expect(
        host.querySelectorAll('[role="radio"][aria-checked="true"]')
      ).toHaveLength(2);
      const selects = Array.from(host.querySelectorAll('[role="combobox"]'));
      // Four choice selectors plus the table page-size selector.
      expect(selects).toHaveLength(5);
      selects
        .slice(0, 4)
        .forEach((select) => expect(select.textContent).toContain('Postal'));
    }
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
