import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonFormsContext } from '@jsonforms/react';
import { expect, it } from 'vitest';
import { TemplateLayoutRenderer } from '../src/renderers/TemplateLayoutRenderer';

it('keeps template hooks stable across visibility changes', () => {
  const container = document.createElement('div');
  const root = createRoot(container);
  const props: any = {
    schema: { type: 'object' },
    path: '',
    enabled: true,
    uischema: { type: 'TemplateLayout', template: '<div />', elements: [] },
    config: {},
    renderers: [],
    cells: [],
  };
  try {
    for (const visible of [false, true, false, true]) {
      expect(() =>
        act(() =>
          root.render(
            <JsonFormsContext.Provider
              value={{ core: { data: {}, errors: [] } } as any}
            >
              <TemplateLayoutRenderer {...props} visible={visible} />
            </JsonFormsContext.Provider>
          )
        )
      ).not.toThrow();
    }
  } finally {
    act(() => root.unmount());
  }
});
