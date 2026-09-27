import { describe, expect, it, vi } from 'vitest';
import {
  URL_REFUSED_DIAGNOSTIC,
  sanitizeUrlAttributes,
  sanitizeUrlProps,
} from '../src/util/templateUrls';
import { defaultUrlPolicy } from '../src/util/urlPolicy';

/*
  The attribute surface, unit-tested.

  `templateUrlPolicy.test.tsx` in the antd-extended package proves the policy
  reaches both string engines end to end; this file is what keeps the *table*
  honest - there are fifteen URL-bearing attributes and only `href` is ever
  the one anybody remembers.
*/

const quiet = () =>
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);

const hostile = 'javascript:alert(1)';

describe('sanitizeUrlProps', () => {
  it('returns the same object when nothing is refused', () => {
    const props = { href: 'https://example.com', className: 'x' };
    expect(sanitizeUrlProps('a', props)).toBe(props);
  });

  it.each([
    ['href', 'a'],
    ['src', 'iframe'],
    ['action', 'form'],
    ['formAction', 'button'],
    ['poster', 'video'],
    ['cite', 'blockquote'],
    ['background', 'body'],
    ['manifest', 'html'],
    ['profile', 'head'],
    ['longDesc', 'img'],
    ['codeBase', 'object'],
    ['classID', 'object'],
    ['xlinkHref', 'use'],
  ])('drops a hostile %s', (name, tag) => {
    quiet();
    const out = sanitizeUrlProps(tag, { [name]: hostile, id: 'k' }) as any;
    expect(out[name]).toBeUndefined();
    // Only the offending attribute goes; the element keeps everything else.
    expect(out.id).toBe('k');
  });

  it('names the attribute and the code in the diagnostic', () => {
    const warn = quiet();
    sanitizeUrlProps('a', { href: hostile });
    expect(String(warn.mock.calls[0][0])).toContain(URL_REFUSED_DIAGNOSTIC);
    expect(String(warn.mock.calls[0][0])).toContain('href');
  });

  it('reports through a supplied handler instead of the console', () => {
    const warn = quiet();
    const seen: string[] = [];
    sanitizeUrlProps('a', { href: hostile }, defaultUrlPolicy, (m) =>
      seen.push(m)
    );
    expect(seen).toHaveLength(1);
    expect(warn).not.toHaveBeenCalled();
  });

  /*
    A list is refused as a whole. Keeping the survivors would silently change
    which image the browser picks, which is a worse outcome than no srcSet.
  */
  it('refuses a whole srcSet when one candidate is hostile', () => {
    quiet();
    const out = sanitizeUrlProps('img', {
      srcSet: `https://example.com/a.png 1x, ${hostile} 2x`,
    }) as any;
    expect(out.srcSet).toBeUndefined();
  });

  it('keeps a srcSet whose candidates are all allowed', () => {
    const props = {
      srcSet: 'https://example.com/a.png 1x, /b.png 2x',
    };
    expect(sanitizeUrlProps('img', props)).toBe(props);
  });

  it('refuses a ping list, which is space separated', () => {
    quiet();
    const out = sanitizeUrlProps('a', {
      href: '/ok',
      ping: `https://example.com/p ${hostile}`,
    }) as any;
    expect(out.ping).toBeUndefined();
    expect(out.href).toBe('/ok');
  });

  /*
    `src` is the one attribute whose kind depends on the element: an inline
    image is a reasonable asset, an inline *document* in an iframe is not.
  */
  it('applies the image policy to img src and the link policy to iframe src', () => {
    quiet();
    const inline = 'data:image/png;base64,iVBORw0KGgo=';
    const opened = { ...defaultUrlPolicy, allowImageDataUrls: true };

    expect((sanitizeUrlProps('img', { src: inline }, opened) as any).src).toBe(
      inline
    );
    expect(
      (sanitizeUrlProps('iframe', { src: inline }, opened) as any).src
    ).toBeUndefined();
  });

  /*
    `data` is a URL on <object> and an ordinary prop name everywhere else, so
    it cannot sit in the table with the others.
  */
  it('treats data as a URL only on object', () => {
    quiet();
    expect(
      (sanitizeUrlProps('object', { data: hostile }) as any).data
    ).toBeUndefined();
    const payload = { data: { rows: 1 } };
    expect(sanitizeUrlProps(() => null, payload)).toBe(payload);
  });

  /*
    A custom component may define `src` as something structured; dropping it
    would break a working template to prevent nothing, since whatever the
    component renders comes back through this pragma.
  */
  it('leaves a non-string prop on a custom component alone', () => {
    const Custom = () => null;
    const props = { src: { bucket: 'a', key: 'b' } };
    expect(sanitizeUrlProps(Custom, props)).toBe(props);
  });

  /* On an intrinsic element React stringifies, so a hostile toString counts. */
  it('judges a stringifying object on an intrinsic element', () => {
    quiet();
    const sneaky = {
      toString: () => hostile,
    };
    const out = sanitizeUrlProps('a', { href: sneaky }) as any;
    expect(out.href).toBeUndefined();
  });

  it('tolerates null props', () => {
    expect(sanitizeUrlProps('a', null)).toBeNull();
    expect(sanitizeUrlProps('a', undefined)).toBeUndefined();
  });
});

describe('sanitizeUrlAttributes', () => {
  const mount = (html: string) => {
    const host = document.createElement('div');
    host.innerHTML = html;
    return host;
  };

  it('strips a hostile attribute from a rendered subtree', () => {
    quiet();
    const host = mount(`<p><a href="${hostile}">go</a></p>`);
    expect(sanitizeUrlAttributes(host)).toBe(1);
    expect(host.querySelector('a')!.hasAttribute('href')).toBe(false);
    // The element stays: refusing a URL is not a reason to hide the text.
    expect(host.querySelector('a')!.textContent).toBe('go');
  });

  it('leaves permitted URLs untouched', () => {
    const host = mount('<a href="/help">go</a><img src="https://e.com/a.png">');
    expect(sanitizeUrlAttributes(host)).toBe(0);
  });

  it('checks the root element itself, not only its descendants', () => {
    quiet();
    const host = document.createElement('a');
    host.setAttribute('href', hostile);
    expect(sanitizeUrlAttributes(host)).toBe(1);
    expect(host.hasAttribute('href')).toBe(false);
  });

  it('matches the namespaced xlink:href without a selector error', () => {
    quiet();
    const host = mount(`<svg><use xlink:href="${hostile}"></use></svg>`);
    expect(sanitizeUrlAttributes(host)).toBe(1);
  });

  it('obeys a narrowed policy', () => {
    quiet();
    const host = mount('<a href="/help">go</a>');
    expect(
      sanitizeUrlAttributes(host, {
        ...defaultUrlPolicy,
        allowRelative: false,
      })
    ).toBe(1);
  });

  it('tolerates a missing root', () => {
    expect(sanitizeUrlAttributes(null)).toBe(0);
  });
});
