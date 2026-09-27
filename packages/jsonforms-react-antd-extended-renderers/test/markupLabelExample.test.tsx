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
import config from '../../jsonforms-react-demo-common/src/examples/spec/markup-label/config.json';
import data from '../../jsonforms-react-demo-common/src/examples/spec/markup-label/data.json';
import schema from '../../jsonforms-react-demo-common/src/examples/spec/markup-label/schema.json';
import uischema from '../../jsonforms-react-demo-common/src/examples/spec/markup-label/uischema.json';
import translations from '../../jsonforms-react-demo-common/src/examples/spec/markup-label/translations.json';
import { translatorFor } from '../../jsonforms-react-demo-common/src/i18nCatalogs';

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

/*
  The parser arrives through a dynamic import, so every assertion has to wait
  for the chunk. This is also the only place that proves the import resolves
  at all - the unit tests import the module directly.
*/
const settle = async (ms = 80) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const draw = (locale = 'en', configOverride?: any) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(
      <ConfigProvider theme={{ token: { motion: false } }}>
        <JsonForms
          data={data}
          schema={schema as any}
          uischema={uischema as any}
          config={configOverride ?? config}
          i18n={{
            locale,
            translate: translatorFor(translations as any, locale),
          }}
          renderers={[...antdRenderers, ...antdExtendedRenderers]}
          cells={antdCells}
          onChange={() => undefined}
        />
      </ConfigProvider>
    )
  );
  /** One markup label, found by a distinctive word in its text. */
  const labelWith = (needle: string) =>
    Array.from(
      container.querySelectorAll<HTMLElement>('[data-markup-label]')
    ).find((el) => el.textContent?.includes(needle));
  return {
    container,
    labelWith,
    links: () => Array.from(container.querySelectorAll('a')),
    diagnostics: () =>
      Array.from(
        container.querySelectorAll<HTMLElement>('[data-markup-diagnostic]')
      ),
    unmount: () => act(() => root.unmount()),
  };
};

describe('the markup-label spec example', () => {
  it('parses the constructs the basic profile supports', async () => {
    const view = draw();
    await settle();
    const joining = view.labelWith('Doors open');
    expect(joining, 'the joining-instructions label is missing').toBeTruthy();
    expect(joining!.getAttribute('data-markup-label')).toBe('markdown');
    expect(joining!.querySelector('strong')?.textContent).toBe(
      'Joining instructions.'
    );
    expect(joining!.querySelector('code')?.textContent).toBe('WS-2417');
    // The source characters are consumed, not shown.
    expect(joining!.textContent).not.toContain('**');
    expect(joining!.textContent).not.toContain('`');
    view.unmount();
  });

  it('renders a list, with bold and strikethrough inside it', async () => {
    const view = draw();
    await settle();
    const bring = view.labelWith('A laptop with a current browser');
    expect(bring).toBeTruthy();
    const items = bring!.querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[1].querySelector('strong')?.textContent).toBe('photo ID');
    expect(items[2].querySelector('s')?.textContent).toBe('A printed ticket');
    // A tight list draws no paragraph inside its items.
    expect(bring!.querySelector('li p')).toBeNull();
    view.unmount();
  });

  /* §10: the basic profile excludes headings. */
  it('shows an excluded heading as its own source text', async () => {
    const view = draw();
    await settle();
    const policy = view.labelWith('Cancel at least 14 days');
    expect(policy).toBeTruthy();
    expect(policy!.querySelector('h1')).toBeNull();
    expect(policy!.textContent).toContain('# Cancellation');
    view.unmount();
  });

  /* §10: Markdown link targets pass the URL policy. */
  it('links an allowed target and de-links a refused one', async () => {
    const view = draw();
    await settle();
    const joining = view.labelWith('Doors open')!;
    const venue = Array.from(joining.querySelectorAll('a')).map((a) =>
      a.getAttribute('href')
    );
    expect(venue).toContain('https://example.com/venue');
    expect(venue).toContain('mailto:workshops@example.com');

    // The example's policy allows https and mailto only, so http is refused.
    const legacy = view.labelWith('original payment method')!;
    expect(legacy.querySelector('a')).toBeNull();
    expect(legacy.textContent).toContain('old policy page');
    expect(view.container.innerHTML).not.toContain(
      'http://example.com/policy-2019'
    );
    view.unmount();
  });

  /* `markup: "plain"` never reaches the parser. */
  it('leaves a plain label exactly as written', async () => {
    const view = draw();
    await settle();
    const rates = view.labelWith('120 EUR');
    // Not claimed by the markup renderer at all - the base one draws it.
    expect(rates).toBeUndefined();
    expect(view.container.textContent).toContain(
      'Rates are 120 EUR* per seat (*excluding VAT).'
    );
    view.unmount();
  });

  it('reports an unsupported markup value and still shows the text', async () => {
    const view = draw();
    await settle();
    const diagnostics = view.diagnostics();
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].getAttribute('data-markup-diagnostic')).toBe(
      'markupUnsupported'
    );
    expect(diagnostics[0].textContent).toContain('"asciidoc"');
    // The whole point: the words are still on the page.
    expect(view.container.textContent).toContain(
      'This notice was authored for a markup language'
    );
    view.unmount();
  });

  /*
    The element option, shown in the example itself rather than only in a
    config-override test - an author reading the uischema should be able to
    see both states side by side.
  */
  it('honours typography: false on one label while its neighbours keep it', async () => {
    const view = draw();
    await settle();
    const fineprint = view.labelWith('Seats are held for')!;
    expect(fineprint.getAttribute('data-markup-label')).toBe('markdown');
    expect(fineprint.querySelector('.ant-typography')).toBeNull();
    // Still parsed: the option is about the box, not about the Markdown.
    expect(fineprint.querySelector('strong')?.textContent).toBe('15 minutes');
    expect(fineprint.querySelector('a')?.getAttribute('href')).toBe(
      'https://example.com/terms'
    );
    // Its neighbour, which says nothing, keeps the wrapper.
    expect(
      view.labelWith('Doors open')!.querySelector('.ant-typography')
    ).toBeTruthy();
    view.unmount();
  });

  it('wraps parsed Markdown in antd typography, without nesting it in a <p>', async () => {
    const view = draw();
    await settle();
    const joining = view.labelWith('Doors open')!;
    const wrapper = joining.querySelector('.ant-typography');
    expect(wrapper, 'the typography wrapper is missing').toBeTruthy();
    /*
      The invariant, not the tag name: whatever the binding wraps block
      content in must not be a `<p>`, because the parsed content contains
      `<p>` and `<ul>` and `<p>` accepts phrasing content only. antd's
      Paragraph happens to render a `div`, which is why one slot serves both
      modes here - see `AntdMarkupLabelRenderer`.
    */
    expect(wrapper!.tagName).not.toBe('P');
    expect(wrapper!.querySelector('p')).toBeTruthy();
    view.unmount();
  });

  it('parses the translated text, not the authored fallback', async () => {
    const view = draw('bg');
    await settle();
    const joining = view.labelWith('Вратите отварят');
    expect(joining, 'the Bulgarian joining label is missing').toBeTruthy();
    // Markdown in the catalog string is parsed the same way.
    expect(joining!.querySelector('strong')?.textContent).toBe(
      'Инструкции за пристигане.'
    );
    expect(joining!.querySelector('code')?.textContent).toBe('WS-2417');
    view.unmount();
  });

  it('localizes the diagnostic', async () => {
    const view = draw('bg');
    await settle();
    expect(view.diagnostics()[0].textContent).toContain(
      'Неподдържано маркиране'
    );
    view.unmount();
  });
});

describe('the host gate and the typography option', () => {
  /*
    `markdown.enabled: false`. The gate defaults to TRUE, unlike the script
    and dynamic-value gates, because a parser that cannot execute anything and
    whose profile excludes HTML, images and embeds is not the same kind of
    risk. A host that closes it anyway gets the diagnostic and the text.
  */
  const gateShut = {
    ...config,
    jsonformsExtended: {
      ...(config as any).jsonformsExtended,
      markup: { markdown: { enabled: false, profile: 'basic' } },
    },
  };

  it('refuses to parse and says why, without hiding the text', async () => {
    const view = draw('en', gateShut);
    await settle();
    const diagnostics = view
      .diagnostics()
      .map((el) => el.getAttribute('data-markup-diagnostic'));
    // Five labels ask for Markdown; a sixth asks for asciidoc.
    expect(diagnostics.filter((d) => d === 'markdownDisabled')).toHaveLength(5);
    expect(diagnostics).toContain('markupUnsupported');

    // The words survive, with their source characters showing.
    expect(view.container.textContent).toContain('**Joining instructions.**');
    expect(view.container.querySelector('strong')).toBeNull();
    view.unmount();
  });

  it('drops the typography wrapper when the config turns it off', async () => {
    const withoutTypography = {
      ...config,
      jsonformsExtended: {
        ...(config as any).jsonformsExtended,
        markup: {
          ...(config as any).jsonformsExtended.markup,
          typography: false,
        },
      },
    };
    const view = draw('en', withoutTypography);
    await settle();
    const joining = view.labelWith('Doors open')!;
    expect(joining.querySelector('.ant-typography')).toBeNull();
    // Still parsed - the option is about the box, not about the Markdown.
    expect(joining.querySelector('strong')?.textContent).toBe(
      'Joining instructions.'
    );
    view.unmount();
  });

  it('lets one element override the form-wide typography default', async () => {
    const perElement = JSON.parse(JSON.stringify(uischema));
    perElement.elements[0].options.typography = false;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <ConfigProvider theme={{ token: { motion: false } }}>
          <JsonForms
            data={data}
            schema={schema as any}
            uischema={perElement}
            config={config}
            renderers={[...antdRenderers, ...antdExtendedRenderers]}
            cells={antdCells}
            onChange={() => undefined}
          />
        </ConfigProvider>
      )
    );
    await settle();
    const labels = Array.from(
      container.querySelectorAll<HTMLElement>('[data-markup-label]')
    );
    const joining = labels.find((el) => el.textContent?.includes('Doors open'));
    const bring = labels.find((el) => el.textContent?.includes('A laptop'));
    expect(joining!.querySelector('.ant-typography')).toBeNull();
    // Its neighbour, which said nothing, keeps the default.
    expect(bring!.querySelector('.ant-typography')).toBeTruthy();
    act(() => root.unmount());
  });
});
