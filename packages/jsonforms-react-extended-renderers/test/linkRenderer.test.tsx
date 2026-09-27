import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { createTranslator } from '@jsonforms/core';
import { createExtendedRenderers } from '../src';
import { linkRel } from '../src/renderers/LinkRenderer';

const renderers = createExtendedRenderers();

const render = (uischema: any, config?: any, i18n?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        data={{}}
        schema={{ type: 'object', properties: {} }}
        uischema={uischema}
        renderers={renderers}
        config={config}
        i18n={i18n}
        onChange={() => undefined}
      />
    )
  );
  return {
    container,
    anchor: container.querySelector('a'),
    inert: container.querySelector('[data-link-inert]'),
    unmount: () => act(() => root.unmount()),
  };
};

const link = (extra: Record<string, unknown> = {}) => ({
  type: 'Link',
  label: 'Help',
  href: '/help',
  ...extra,
});

describe('Link renderer', () => {
  it('renders an anchor with its label and href', () => {
    const { anchor, unmount } = render(link());
    expect(anchor).toBeTruthy();
    expect(anchor!.getAttribute('href')).toBe('/help');
    expect(anchor!.textContent).toBe('Help');
    unmount();
  });

  it('falls back to the href when no label is supplied', () => {
    const { anchor, unmount } = render({ type: 'Link', href: '/help' });
    expect(anchor!.textContent).toBe('/help');
    unmount();
  });

  it('is hideable through a rule', () => {
    const { container, unmount } = render({
      ...link(),
      rule: { effect: 'HIDE', condition: { scope: '#', schema: {} } },
    });
    expect(container.querySelector('a')).toBeNull();
    unmount();
  });

  describe('target and rel', () => {
    it('adds noopener and noreferrer to _blank', () => {
      const { anchor, unmount } = render(link({ target: '_blank' }));
      expect(anchor!.getAttribute('target')).toBe('_blank');
      const rel = anchor!.getAttribute('rel')!.split(' ');
      // noopener is a MUST: without it the opened page gets window.opener and
      // can navigate the form away.
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
      unmount();
    });

    it('keeps an author-supplied rel and adds to it', () => {
      const { anchor, unmount } = render(
        link({ target: '_blank', rel: 'nofollow' })
      );
      const rel = anchor!.getAttribute('rel')!.split(' ');
      expect(rel).toContain('nofollow');
      expect(rel).toContain('noopener');
      unmount();
    });

    it('does not force noopener on other targets', () => {
      const { anchor, unmount } = render(link({ target: '_self' }));
      expect(anchor!.getAttribute('rel')).toBeNull();
      unmount();
    });

    it('never duplicates a token', () => {
      expect(linkRel('_blank', 'noopener')).toBe('noopener noreferrer');
      expect(linkRel('_blank', 'noopener noreferrer')).toBe(
        'noopener noreferrer'
      );
      expect(linkRel(undefined, undefined)).toBeUndefined();
    });
  });

  describe('URL policy', () => {
    it('renders an empty href as plain text, inventing no destination', () => {
      const { anchor, inert, unmount } = render(link({ href: '' }));
      expect(anchor).toBeNull();
      expect(inert!.textContent).toBe('Help');
      unmount();
    });

    it.each([
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      '//evil.example.com',
    ])('refuses to make %s navigable', (href) => {
      const { anchor, inert, unmount } = render(link({ href }));
      // The text stays readable, but it is not an anchor and carries no href.
      expect(anchor).toBeNull();
      expect(inert).toBeTruthy();
      expect(inert!.textContent).toBe('Help');
      unmount();
    });

    it('honours a tightened policy from config', () => {
      const httpsOnly = {
        jsonformsExtended: {
          security: {
            urlPolicy: { allowedSchemes: ['https'], allowRelative: false },
          },
        },
      };
      expect(render(link({ href: '/help' }), httpsOnly).anchor).toBeNull();
      expect(
        render(link({ href: 'https://example.com' }), httpsOnly).anchor
      ).toBeTruthy();
    });
  });

  it('translates its label through an explicit i18n prefix', () => {
    // A Link has no scope, so only uischema.i18n can supply a prefix.
    const { anchor, unmount } = render(link({ i18n: 'help' }), undefined, {
      locale: 'bg',
      translate: createTranslator((key, fallback) =>
        key === 'help.label' ? 'Помощ' : fallback
      ),
    });
    expect(anchor!.textContent).toBe('Помощ');
    unmount();
  });
});
