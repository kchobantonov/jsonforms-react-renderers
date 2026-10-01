import React, { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import * as Demo from '../../../apps/jsonforms-react-shadcn-demo/src/components/ui/dialog';
import * as Webcomponent from '../../jsonforms-react-shadcn-webcomponent/src/components/ui/dialog';

describe.each([
  ['demo', Demo],
  ['webcomponent', Webcomponent],
] as const)('%s dialog refs', (_, UI) => {
  it('opens a portal dialog and forwards the overlay ref without warnings', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const ref = createRef<HTMLDivElement>();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      act(() =>
        root.render(
          <UI.Dialog open>
            <UI.DialogContent>
              <UI.DialogTitle>Delete item?</UI.DialogTitle>
              <UI.DialogDescription>
                This removes the item.
              </UI.DialogDescription>
            </UI.DialogContent>
            <UI.DialogPortal>
              <UI.DialogOverlay ref={ref} />
            </UI.DialogPortal>
          </UI.Dialog>
        )
      );
      expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
        'Delete item?'
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.dataset.slot).toBe('dialog-overlay');
      expect(errors.mock.calls.flat().join(' ')).not.toMatch(
        /cannot be given refs|check the render method/i
      );
    } finally {
      act(() => root.unmount());
      container.remove();
      errors.mockRestore();
    }
  });
});
