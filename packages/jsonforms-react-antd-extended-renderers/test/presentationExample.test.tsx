import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';
import config from '../../jsonforms-react-demo-common/src/examples/spec/presentation/config.json';
import data from '../../jsonforms-react-demo-common/src/examples/spec/presentation/data.json';
import schema from '../../jsonforms-react-demo-common/src/examples/spec/presentation/schema.json';
import uischema from '../../jsonforms-react-demo-common/src/examples/spec/presentation/uischema.json';

/*
  The elements that read nothing and write nothing: ImageView, Link, Spacer,
  Separator and Label.

  They are grouped into categories, so each assertion opens its tab first.
*/

(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ??
  class {
    observe() {
      /* nothing to measure in jsdom */
    }
    unobserve() {
      /* nothing to measure in jsdom */
    }
    disconnect() {
      /* nothing to measure in jsdom */
    }
  };

afterEach(() => {
  document.body.innerHTML = '';
});

const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const draw = (override?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let current: any = { ...data, ...(override ?? {}) };
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={current}
          schema={schema as any}
          uischema={uischema as any}
          config={config}
          renderers={[...antdRenderers, ...antdExtendedRenderers]}
          cells={antdCells}
          onChange={({ data: next }) => {
            current = next;
          }}
        />
      </ConfigProvider>
    )
  );

  const active = () =>
    container.querySelector<HTMLElement>('.ant-tabs-content-active');

  return {
    container,
    active,
    images: () =>
      Array.from(active()?.querySelectorAll<HTMLImageElement>('img') ?? []),
    links: () => Array.from(active()?.querySelectorAll<HTMLAnchorElement>('a') ?? []),
    diagnostics: () =>
      Array.from(
        container.querySelectorAll<HTMLElement>('[data-image-diagnostic]')
      ).map((el) => el.getAttribute('data-image-diagnostic')),
    selectTab: async (label: string) => {
      const tab = Array.from(
        container.querySelectorAll<HTMLElement>('.ant-tabs-tab')
      ).find((candidate) => candidate.textContent?.includes(label));
      expect(tab, `no tab labelled ${label}`).toBeTruthy();
      act(() => tab!.click());
      await settle();
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('ImageView', () => {
  /*
    The whole reason this example exists: these are top-level fields, and a
    conformant element used to render nothing whatsoever.
  */
  it('renders a static src with its alt text', async () => {
    const view = draw();
    await view.selectTab('ImageView');
    const banner = view
      .images()
      .find((img) => img.alt.includes('Course handbook'));
    expect(banner, 'the banner image is missing').toBeTruthy();
    expect(banner!.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
    view.unmount();
  });

  /*
    `allowImageDataUrls` is off by default and the fixture turns it on. Without
    the flag these inline images are refused - which is the point of the flag,
    and the reason the example carries a config at all.
  */
  it('loads inline images only because the policy allows them', async () => {
    const view = draw();
    await view.selectTab('ImageView');
    expect(view.images().length).toBeGreaterThan(0);
    expect(view.diagnostics()).toEqual([]);
    view.unmount();
  });

  it('resolves a scoped image out of the data', async () => {
    const view = draw();
    await view.selectTab('ImageView');
    const badge = view.images().find((img) => img.alt === 'Course completion badge');
    expect(badge?.getAttribute('src')).toBe((data as any).badgeImage);
    view.unmount();
  });

  /* "Empty or missing source data displays no image" - and says nothing. */
  it('shows nothing, quietly, when the bound property is cleared', async () => {
    const view = draw({ badgeImage: '' });
    await view.selectTab('ImageView');
    expect(
      view.images().find((img) => img.alt === 'Course completion badge')
    ).toBeUndefined();
    expect(view.diagnostics()).toEqual([]);
    view.unmount();
  });

  /* `alt: ""` is the documented way to mark an image decorative. */
  it('keeps an explicitly empty alt', async () => {
    const view = draw();
    await view.selectTab('ImageView');
    expect(view.images().some((img) => img.getAttribute('alt') === '')).toBe(
      true
    );
    view.unmount();
  });

  /* Visibility follows the common element contract. */
  it('obeys a rule', async () => {
    const view = draw({ showBanner: false });
    await view.selectTab('ImageView');
    expect(
      view.images().find((img) => img.alt.includes('Course handbook'))
    ).toBeUndefined();
    view.unmount();
  });
});

describe('Link', () => {
  it('renders an anchor to its href', async () => {
    const view = draw();
    await view.selectTab('Link');
    const link = view.links().find((a) => a.textContent === 'Course catalogue');
    expect(link?.getAttribute('href')).toBe('https://example.com/courses');
    view.unmount();
  });

  /*
    "target=_blank MUST enforce noopener and SHOULD add noreferrer." Without
    noopener the opened page gets a handle on this one and can navigate the
    form away.
  */
  it('forces noopener on a new tab', async () => {
    const view = draw();
    await view.selectTab('Link');
    const link = view.links().find((a) => a.target === '_blank');
    expect(link?.getAttribute('rel')).toContain('noopener');
    expect(link?.getAttribute('rel')).toContain('noreferrer');
    view.unmount();
  });

  /*
    "Empty href is allowed and renders non-navigating/plain semantics rather
    than inventing a destination."
  */
  it('renders an empty href as plain text', async () => {
    const view = draw();
    await view.selectTab('Link');
    expect(
      view.links().some((a) => a.textContent === 'Not yet published')
    ).toBe(false);
    expect(view.active()?.textContent).toContain('Not yet published');
    view.unmount();
  });

  /* A refused scheme is treated the same way: readable, and not a link. */
  it('does not turn a refused URL into an anchor', async () => {
    const view = draw();
    await view.selectTab('Link');
    expect(view.links().some((a) => a.textContent === 'Refused by policy')).toBe(
      false
    );
    expect(view.active()?.textContent).toContain('Refused by policy');
    expect(view.container.innerHTML).not.toContain('javascript:alert');
    view.unmount();
  });
});

describe('Spacer and Separator', () => {
  it('uses 32 pixels by default and the top-level size when given', async () => {
    const view = draw();
    await view.selectTab('Spacer and Separator');
    const heights = Array.from(
      view.active()!.querySelectorAll<HTMLElement>('div[style*="height"]')
    ).map((el) => el.style.height);
    expect(heights).toContain('32px');
    expect(heights).toContain('64px');
    view.unmount();
  });

  /* `options.vertical` is section 13's one orientation encoding. */
  it('renders both separator orientations', async () => {
    const view = draw();
    await view.selectTab('Spacer and Separator');
    const orientations = Array.from(
      view.active()!.querySelectorAll<HTMLElement>('[data-separator]')
    ).map((el) => el.getAttribute('data-separator'));
    expect(orientations).toContain('horizontal');
    expect(orientations).toContain('vertical');
    view.unmount();
  });

  it('declares the orientation to assistive technology', async () => {
    const view = draw();
    await view.selectTab('Spacer and Separator');
    const vertical = view.active()!.querySelector('[data-separator="vertical"]');
    expect(vertical?.getAttribute('aria-orientation')).toBe('vertical');
    view.unmount();
  });
});

describe('none of them touch the data', () => {
  /*
    "This display-only element visually separates sections without reading or
    modifying form data." Mounting the whole fixture must commit nothing.
  */
  it('commits nothing on mount', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const writes: any[] = [];
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={data}
            schema={schema as any}
            uischema={uischema as any}
            config={config}
            renderers={[...antdRenderers, ...antdExtendedRenderers]}
            cells={antdCells}
            onChange={({ data: next }) => writes.push(next)}
          />
        </ConfigProvider>
      )
    );
    await settle();
    // One initial notification, and it carries the data unchanged.
    expect(writes[writes.length - 1]).toEqual(data);
    act(() => root.unmount());
  });
});
