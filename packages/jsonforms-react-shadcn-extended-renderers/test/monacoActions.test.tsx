import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { shadcnExtendedRenderers } from '../src';

vi.mock('@monaco-editor/react', () => ({
  default: () => <textarea aria-label='Code editor' />,
}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

it.each([
  ['en', 'Maximize editor', 'Restore editor', undefined],
  [
    'bg',
    'Максимизиране на редактора',
    'Възстановяване на редактора',
    undefined,
  ],
  [
    'en',
    'Expand code',
    'Collapse code',
    { 'editor.maximize': 'Expand code', 'editor.restore': 'Collapse code' },
  ],
])(
  'uses icon actions and translated tooltips for %s',
  async (locale, maximize, restore, catalog) => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () =>
        root.render(
          <JsonForms
            schema={{ type: 'string' }}
            uischema={
              {
                type: 'Control',
                scope: '#',
                options: { format: 'code', language: 'javascript' },
              } as any
            }
            data='const value = 1;'
            renderers={shadcnExtendedRenderers}
            i18n={{
              locale: locale as string,
              translate: (key, fallback) => catalog?.[key] ?? fallback,
            }}
          />
        )
      );
      await vi.waitFor(async () => {
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        });
        expect(container.innerHTML).toContain('textarea');
      });
      act(() => container.querySelector('textarea')!.focus());
      const action = () => container.querySelector('button')!;
      expect(action().getAttribute('title')).toBe(maximize);
      expect(action().getAttribute('aria-label')).toBe(maximize);
      expect(action().querySelector('svg')).toBeTruthy();
      expect(action().textContent).toBe('');
      act(() => action().click());
      expect(action().getAttribute('title')).toBe(restore);
      expect(action().getAttribute('aria-label')).toBe(restore);
      expect(action().querySelector('svg')).toBeTruthy();
      expect(action().textContent).toBe('');
      act(() => action().click());
      expect(action().getAttribute('title')).toBe(maximize);
    } finally {
      act(() => root.unmount());
      container.remove();
    }
  }
);
