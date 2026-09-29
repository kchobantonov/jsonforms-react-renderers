import React, { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Input } from '../../../apps/jsonforms-react-shadcn-demo/src/components/ui/input';
import { Input as WebcomponentInput } from '../../jsonforms-react-shadcn-webcomponent/src/components/ui/input';

describe.each([['demo', Input], ['webcomponent', WebcomponentInput]] as const)('%s input refs', (_, HostInput) => {
  it('exposes the native file input for picker actions without ref warnings', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const ref = createRef<HTMLInputElement>();
    const onClick = vi.fn();
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      act(() => root.render(<HostInput ref={ref} type='file' onClick={onClick} />));
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current!.type).toBe('file');
      act(() => ref.current!.click());
      expect(onClick).toHaveBeenCalledOnce();
      ref.current!.value = '';
      expect(ref.current!.value).toBe('');
      expect(errors.mock.calls.flat().join(' ')).not.toMatch(/cannot be given refs|check the render method/i);
    } finally {
      act(() => root.unmount());
      expect(ref.current).toBeNull();
      container.remove();
      errors.mockRestore();
    }
  });
});
