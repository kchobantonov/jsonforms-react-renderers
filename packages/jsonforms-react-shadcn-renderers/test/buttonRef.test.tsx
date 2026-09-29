import React, { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../../../apps/jsonforms-react-shadcn-demo/src/components/ui/button';
import { Button as WebcomponentButton } from '../../jsonforms-react-shadcn-webcomponent/src/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@jsonforms-react-shadcn-ui/collapsible';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@jsonforms-react-shadcn-ui/tooltip';

describe.each([['demo', Button], ['webcomponent', WebcomponentButton]] as const)('%s Button refs', (_, HostButton) => {
  it('forwards refs through collapsible and tooltip triggers without warnings', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const ref = createRef<HTMLButtonElement>();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      act(() => root.render(<>
        <Collapsible><CollapsibleTrigger render={<HostButton ref={ref} />}>Expand</CollapsibleTrigger><CollapsibleContent>Details</CollapsibleContent></Collapsible>
        <TooltipProvider><Tooltip><TooltipTrigger asChild><HostButton>Errors</HostButton></TooltipTrigger><TooltipContent>Invalid value</TooltipContent></Tooltip></TooltipProvider>
      </>));
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      act(() => ref.current!.click());
      expect(ref.current!.getAttribute('aria-expanded')).toBe('true');
      expect(errors.mock.calls.flat().join(' ')).not.toMatch(/cannot be given refs|check the render method/i);
    } finally {
      act(() => root.unmount());
      container.remove();
      errors.mockRestore();
    }
  });
});
