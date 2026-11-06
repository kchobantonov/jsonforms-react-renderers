import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import { expect, it } from 'vite-plus/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { shadcnExtendedRenderers } from '../src';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
it.each(['', 'dark'])('uses host button theme variants in %s mode', (mode) => {
  const host = document.createElement('div');
  host.className = mode;
  document.body.append(host);
  const root = createRoot(host);
  try {
    for (const [color, variant] of Object.entries({
      primary: 'default',
      secondary: 'outline',
      alternative: 'secondary',
      success: 'default',
      warning: 'outline',
      error: 'destructive',
    })) {
      act(() =>
        root.render(
          <JsonForms
            schema={{}}
            data={{}}
            uischema={{ type: 'Button', label: 'Action', color } as any}
            renderers={shadcnExtendedRenderers}
          />,
        ),
      );
      const button = host.querySelector('button')!;
      expect(button.dataset.slot).toBe('button');
      expect(button.dataset.variant).toBe(variant);
      expect(button.classList.contains('shadcn-jsonforms-button')).toBe(false);
      if (color === 'primary')
        expect(button.className).toContain('text-primary-foreground');
      if (color === 'warning')
        expect(button.className).toContain('text-destructive');
    }
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
it('does not override the host Button colors through renderer CSS', () => {
  const css = readFileSync(
    resolve(__dirname, '../../jsonforms-react-shadcn-renderers/src/styles.css'),
    'utf8',
  );
  expect(css).not.toContain('.shadcn-jsonforms-button');
});

it('translates action button labels through the form locale', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  try {
    for (const [locale, label] of [
      ['en', 'English'],
      ['bg', 'Английски'],
    ]) {
      act(() =>
        root.render(
          <JsonForms
            schema={{}}
            data={{}}
            uischema={{
              type: 'Button',
              label: 'static-text.English',
              action: 'changeLang',
            } as any}
            renderers={shadcnExtendedRenderers}
            i18n={{
              locale,
              translate: (key, fallback) =>
                key === 'static-text.English' ? label : fallback,
            }}
          />,
        ),
      );
      expect(host.querySelector('button')?.textContent).toBe(label);
    }
  } finally {
    act(() => root.unmount());
    host.remove();
  }
});
