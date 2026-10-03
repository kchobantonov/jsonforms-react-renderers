import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { JsonForms } from '@jsonforms/react';
import { createExtendedRenderers } from '../src';
import { resolveImageView } from '../src/renderers/ImageViewRenderer';

const renderers = createExtendedRenderers();

/*
  `ImageView`, section 13.

  The element's fields are **top-level** - `src`, `scope`, `alt` - and the two
  sources are not fallbacks for one another. Most of what the section asks for
  is precedence, so `resolveImageView` is tested directly and the component
  tests cover only what needs a form around it: scope resolution against the
  data, and the array-item path.
*/

afterEach(() => {
  document.body.innerHTML = '';
});

const schema: any = {
  type: 'object',
  properties: {
    photo: { type: 'string' },
    size: { type: 'number' },
    badges: {
      type: 'array',
      items: {
        type: 'object',
        properties: { icon: { type: 'string' }, name: { type: 'string' } },
      },
    },
  },
};

const draw = (uischema: any, data: any = {}, config?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <JsonForms
        data={data}
        schema={schema}
        uischema={uischema}
        config={config}
        renderers={renderers}
        cells={[]}
        onChange={() => undefined}
      />
    )
  );
  return {
    container,
    images: () =>
      Array.from(container.querySelectorAll<HTMLImageElement>('img')).map(
        (img) => img.getAttribute('src')
      ),
    alts: () =>
      Array.from(container.querySelectorAll<HTMLImageElement>('img')).map(
        (img) => img.getAttribute('alt')
      ),
    diagnostics: () =>
      Array.from(
        container.querySelectorAll<HTMLElement>('[data-image-diagnostic]')
      ).map((el) => el.getAttribute('data-image-diagnostic')),
    unmount: () => act(() => root.unmount()),
  };
};

describe('the source fields are top-level', () => {
  /*
    The regression this file exists for: a spec-conformant element used to
    render nothing at all, because the renderer only looked in `options`.
  */
  it('renders a top-level src', () => {
    const view = draw({
      type: 'ImageView',
      src: '/images/logo.png',
      alt: 'Company',
    });
    expect(view.images()).toEqual(['/images/logo.png']);
    expect(view.alts()).toEqual(['Company']);
    view.unmount();
  });

  /* The shape this renderer used to require, kept working on purpose. */
  it('still reads the legacy options.src', () => {
    const view = draw({
      type: 'ImageView',
      options: { src: '/images/legacy.png', alt: 'Legacy' },
    });
    expect(view.images()).toEqual(['/images/legacy.png']);
    view.unmount();
  });

  it('prefers the top-level field when both are present', () => {
    const resolved = resolveImageView(
      {
        type: 'ImageView',
        src: '/top.png',
        alt: 'Top',
        options: { src: '/legacy.png', alt: 'Legacy' },
      } as any,
      {}
    );
    expect(resolved.src).toBe('/top.png');
    expect(resolved.alt).toBe('Top');
  });
});

describe('src and scope are not fallbacks for one another', () => {
  /* "If effective src is defined, use it, including an empty string which
     intentionally displays no image." */
  it('treats an empty src as a deliberate blank, not a missing value', () => {
    const view = draw(
      { type: 'ImageView', src: '', scope: '#/properties/photo', alt: '' },
      { photo: '/photo.png' }
    );
    expect(view.images()).toEqual([]);
    expect(view.diagnostics()).toEqual([]);
    view.unmount();
  });

  /* "An invalid defined src does not silently fall through to scope." */
  it('does not fall through to scope when a defined src is refused', () => {
    const view = draw(
      {
        type: 'ImageView',
        src: 'javascript:alert(1)',
        scope: '#/properties/photo',
        alt: 'Logo',
      },
      { photo: '/photo.png' }
    );
    expect(view.images()).toEqual([]);
    expect(view.diagnostics()).toEqual(['image.urlRefused']);
    view.unmount();
  });

  /* "At least one of src or scope must be supplied." */
  it('diagnoses an element with neither source', () => {
    const view = draw({ type: 'ImageView', alt: 'Nothing' });
    expect(view.diagnostics()).toEqual(['image.noSource']);
    view.unmount();
  });
});

describe('resolving a scope', () => {
  it('reads the image URL out of the data', () => {
    const view = draw(
      { type: 'ImageView', scope: '#/properties/photo', alt: 'Profile photo' },
      { photo: '/people/ada.png' }
    );
    expect(view.images()).toEqual(['/people/ada.png']);
    view.unmount();
  });

  /* "Empty or missing source data displays no image" - and says nothing. */
  it('shows nothing, quietly, when the property is unset', () => {
    const view = draw(
      { type: 'ImageView', scope: '#/properties/photo', alt: 'Profile photo' },
      {}
    );
    expect(view.images()).toEqual([]);
    expect(view.diagnostics()).toEqual([]);
    view.unmount();
  });

  /* "The scoped schema must permit strings." */
  it('refuses a scope whose schema cannot hold a string', () => {
    const view = draw(
      { type: 'ImageView', scope: '#/properties/size', alt: 'Size' },
      { size: 4 }
    );
    expect(view.diagnostics()).toEqual(['image.scopeNotString']);
    view.unmount();
  });

  /* "supplied non-string values produce a diagnostic rather than being
     coerced to URLs" */
  it('diagnoses a non-string value rather than coercing it', () => {
    const resolved = resolveImageView(
      { type: 'ImageView', scope: '#/properties/photo', alt: 'Photo' } as any,
      { schema, rootSchema: schema, data: { photo: { url: '/x.png' } } }
    );
    expect(resolved.src).toBeUndefined();
    expect(resolved.diagnostics.map((d) => d.code)).toEqual([
      'image.nonStringSource',
    ]);
  });

  /*
    "including the current array-item path". Inside an array item the renderer
    is handed that item's `path` and its item schema, and the scope composes
    onto it - so the same element resolves to each item's own value. This is
    the unit of that; the presentational example drives it through a real
    array.
  */
  it('composes the scope onto the enclosing array-item path', () => {
    const itemSchema = schema.properties.badges.items;
    const data = {
      badges: [{ icon: '/badges/gold.png' }, { icon: '/badges/silver.png' }],
    };
    const element: any = {
      type: 'ImageView',
      scope: '#/properties/icon',
      alt: 'Badge',
    };
    const at = (path: string) =>
      resolveImageView(element, {
        schema: itemSchema,
        rootSchema: schema,
        data,
        path,
      }).src;
    expect(at('badges.0')).toBe('/badges/gold.png');
    expect(at('badges.1')).toBe('/badges/silver.png');
  });

  /* A scoped source goes through the URL policy too. */
  it('applies the URL policy to a scoped source', () => {
    const view = draw(
      { type: 'ImageView', scope: '#/properties/photo', alt: 'Photo' },
      { photo: 'javascript:alert(1)' }
    );
    expect(view.images()).toEqual([]);
    expect(view.diagnostics()).toEqual(['image.urlRefused']);
    view.unmount();
  });

  /* `data:` images are off by default and turned on through the policy. */
  it('honours allowImageDataUrls', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';
    const refused = draw(
      { type: 'ImageView', src: dataUrl, alt: 'Inline' },
      {}
    );
    expect(refused.images()).toEqual([]);
    refused.unmount();

    const allowed = draw(
      { type: 'ImageView', src: dataUrl, alt: 'Inline' },
      {},
      {
        jsonformsExtended: {
          security: { urlPolicy: { allowImageDataUrls: true } },
        },
      }
    );
    expect(allowed.images()).toEqual([dataUrl]);
    allowed.unmount();
  });
});

describe('alt text', () => {
  /* `alt: ""` is the documented way to say "decorative". */
  it('accepts an explicit empty alt without complaint', () => {
    const view = draw({ type: 'ImageView', src: '/d.png', alt: '' });
    expect(view.alts()).toEqual(['']);
    expect(view.diagnostics()).toEqual([]);
    view.unmount();
  });

  /*
    A missing alt is not the same statement. It is reported - but the image
    still renders, because withholding content over a missing annotation helps
    nobody.
  */
  it('reports a missing alt and still shows the image', () => {
    const view = draw({ type: 'ImageView', src: '/d.png' });
    expect(view.images()).toEqual(['/d.png']);
    expect(view.diagnostics()).toEqual(['image.missingAlt']);
    view.unmount();
  });
});

describe('visibility', () => {
  it('renders nothing when a rule hides it', () => {
    const view = draw(
      {
        type: 'ImageView',
        src: '/d.png',
        alt: 'Hidden',
        rule: {
          effect: 'HIDE',
          condition: { scope: '#/properties/photo', schema: { const: 'hide' } },
        },
      },
      { photo: 'hide' }
    );
    expect(view.images()).toEqual([]);
    expect(view.diagnostics()).toEqual([]);
    view.unmount();
  });
});

it('keeps long blocked sources out of the warning and exposes details on focus', () => {
  const source = 'data:image/svg+xml;base64,' + 'A'.repeat(10000);
  const view = draw({ type: 'ImageView', src: source, alt: 'Preview' });
  expect(view.container.textContent).toBe('Image blocked');
  expect(view.container.innerHTML).not.toContain(source);
  const button = view.container.querySelector('button')!;
  act(() => button.focus());
  expect(
    view.container.querySelector('[role="tooltip"]')?.textContent
  ).toContain('configured URL policy');
  act(() =>
    button.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    )
  );
  expect(view.container.querySelector('[role="tooltip"]')).toBeNull();
  view.unmount();
});
