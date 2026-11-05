import { expect, it } from 'vite-plus/test';
import { canonicalUiOptions } from '../src/components/ExtendedJsonForms';

it('removes only UI element readonly aliases and preserves native editor options', () => {
  const ui = {
    type: 'Control',
    scope: '#',
    options: {
      readOnly: true,
      monaco: { options: { readOnly: true } },
      detail: {
        type: 'Control',
        scope: '#/items',
        options: { readOnly: true },
      },
    },
  };
  expect(canonicalUiOptions(ui)).toEqual({
    type: 'Control',
    scope: '#',
    options: {
      monaco: { options: { readOnly: true } },
      detail: { type: 'Control', scope: '#/items', options: {} },
    },
  });
  expect(ui.options.readOnly).toBe(true);
});
