import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '../src';

/*
  Section 12's URL policy, reaching the template engines.

  It never did. `Link` and `ImageView` have always checked, but a template
  wrote `href={data.url}` straight into the anchor, so a `javascript:` URL
  arriving in **form data** became a working script the moment anybody clicked
  it. Text interpolation was never the hole - React escapes it - which is
  exactly why this one lasted: everything a reader would test looked right.

  The fixture puts the hostile value in `data`, not in the template, because
  that is where it comes from in the case that matters.
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
  vi.restoreAllMocks();
});

const settle = async (ms = 250) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const schema = {
  type: 'object',
  properties: {
    url: { type: 'string' },
    img: { type: 'string' },
  },
} as any;

const allowEval = {
  jsonformsExtended: { security: { allowScriptEvaluation: true } },
};

const draw = async (uischema: any, data: any, config: any = allowEval) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema}
          uischema={uischema}
          config={config}
          renderers={[...antdRenderers, ...antdExtendedRenderers]}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  await settle();
  return { container, unmount: () => act(() => root.unmount()) };
};

const anchor = (container: HTMLElement) =>
  container.querySelector<HTMLAnchorElement>('a[data-link]');
const image = (container: HTMLElement) =>
  container.querySelector<HTMLImageElement>('img[data-pic]');

const engines = [
  {
    name: 'jsx',
    uischema: {
      type: 'TemplateLayout',
      lang: 'jsx',
      template:
        '<div><a data-link href={data.url}>go</a><img data-pic src={data.img} alt="p" /></div>',
      elements: [],
    },
  },
  {
    name: 'ractive',
    uischema: {
      type: 'TemplateLayout',
      lang: 'ractive',
      template:
        '<div><a data-link href="{{data.url}}">go</a><img data-pic src="{{data.img}}" alt="p" /></div>',
      elements: [],
    },
  },
];

/*
  The third engine cannot be covered the same way, and the test says so rather
  than leaving a silent hole in a security file: a TSX template is compiled by
  the build with React's own pragma, so there is no interception point. What it
  gets instead is the resolved policy, so applying it is one call rather than a
  research task.
*/
describe('the native (TSX) profile', () => {
  it('is handed the resolved policy to apply itself', async () => {
    let seen: any;
    const view = await draw(
      {
        type: 'TemplateLayout',
        template: (p: any) => {
          seen = p.urlPolicy;
          return <span data-tsx>ok</span>;
        },
        elements: [],
      },
      { url: '/help', img: '' },
      {
        jsonformsExtended: {
          security: { urlPolicy: { allowedSchemes: ['https'] } },
        },
      }
    );
    expect(view.container.querySelector('[data-tsx]')).toBeTruthy();
    expect(seen).toMatchObject({ allowedSchemes: ['https'] });
    view.unmount();
  });

  /* And the helper it is meant to call is exported, not internal. */
  it('exports the check the template is expected to use', async () => {
    const mod = await import('@chobantonov/jsonforms-react-extended-renderers');
    expect(typeof (mod as any).isAllowedUrl).toBe('function');
    // eslint-disable-next-line no-script-url
    expect((mod as any).isAllowedUrl('javascript:alert(1)')).toBe(false);
  });
});

describe.each(engines)('the $name profile', ({ uischema }) => {
  it('refuses a javascript: href that arrived in the data', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const view = await draw(uischema, {
      // eslint-disable-next-line no-script-url
      url: 'javascript:alert(1)',
      img: 'https://example.com/a.png',
    });

    const link = anchor(view.container);
    expect(link, 'the template rendered no anchor').toBeTruthy();
    expect(link!.getAttribute('href')).toBeNull();
    // The element survives - a refused URL is not a reason to hide the text.
    expect(link!.textContent).toContain('go');
    expect(warn.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      'template.urlRefused'
    );
    view.unmount();
  });

  it('leaves an ordinary href alone', async () => {
    const view = await draw(uischema, {
      url: 'https://example.com/help',
      img: 'https://example.com/a.png',
    });
    expect(anchor(view.container)!.getAttribute('href')).toBe(
      'https://example.com/help'
    );
    view.unmount();
  });

  it('allows a relative href, which the default policy permits', async () => {
    const view = await draw(uischema, {
      url: '/help',
      img: 'https://example.com/a.png',
    });
    expect(anchor(view.container)!.getAttribute('href')).toBe('/help');
    view.unmount();
  });

  /* `data:` images are off unless the host opts in - a CSP img-src bypass. */
  it('refuses a data: image by default and allows it when configured', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const inline = 'data:image/png;base64,iVBORw0KGgo=';

    const closed = await draw(uischema, {
      url: '/help',
      img: inline,
    });
    expect(image(closed.container)!.getAttribute('src')).toBeNull();
    closed.unmount();

    const opened = await draw(
      uischema,
      { url: '/help', img: inline },
      {
        jsonformsExtended: {
          security: {
            allowScriptEvaluation: true,
            urlPolicy: { allowImageDataUrls: true },
          },
        },
      }
    );
    expect(image(opened.container)!.getAttribute('src')).toBe(inline);
    opened.unmount();
  });

  /* The policy is configuration, so a stricter host is obeyed too. */
  it('obeys a narrowed scheme list', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const view = await draw(
      uischema,
      { url: 'http://example.com', img: '' },
      {
        jsonformsExtended: {
          security: {
            allowScriptEvaluation: true,
            urlPolicy: { allowedSchemes: ['https'], allowRelative: false },
          },
        },
      }
    );
    expect(anchor(view.container)!.getAttribute('href')).toBeNull();
    view.unmount();
  });
});
