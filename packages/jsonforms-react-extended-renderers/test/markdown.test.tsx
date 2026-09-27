import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  escapeMarkdown,
  markdownParser,
  renderMarkdown,
} from '../src/util/markdown';
import type { MarkdownContext } from '../src/util/markdown';

/**
 * The rendered output is inspected as HTML because that is the readable form
 * of a React tree, but nothing under test ever produces an HTML string: the
 * markup below is `renderToStaticMarkup` serializing elements the walk built
 * from tokens.
 */
const html = (markdown: string, context?: MarkdownContext) =>
  renderToStaticMarkup(
    <>{renderMarkdown(markdown, context) as React.ReactNode[]}</>
  );

describe('the basic Markdown profile', () => {
  /* §10: "paragraphs and line breaks, bold, italic, strikethrough, inline
     code, links, and ordered and unordered lists." */
  it('renders every construct the profile supports', () => {
    expect(html('a paragraph')).toBe('<p>a paragraph</p>');
    expect(html('**bold**')).toBe('<p><strong>bold</strong></p>');
    expect(html('*italic*')).toBe('<p><em>italic</em></p>');
    expect(html('~~gone~~')).toBe('<p><s>gone</s></p>');
    expect(html('`code`')).toBe('<p><code>code</code></p>');
    expect(html('- one\n- two')).toBe('<ul><li>one</li><li>two</li></ul>');
    expect(html('1. one\n2. two')).toBe('<ol><li>one</li><li>two</li></ol>');
  });

  it('renders a hard break, and not a soft one', () => {
    // Two trailing spaces are a hard break...
    expect(html('one  \ntwo')).toBe('<p>one<br/>two</p>');
    // ...a bare newline is not, and must not become one.
    expect(html('one\ntwo')).toBe('<p>one two</p>');
  });

  /*
    Excluded rules are DISABLED rather than filtered out of the output, so the
    source text survives verbatim instead of being silently promoted.
  */
  it('leaves an excluded construct as its literal text', () => {
    expect(html('# Title')).toBe('<p># Title</p>');
    expect(html('> quoted')).toBe('<p>&gt; quoted</p>');
    expect(html('a | b\n--- | ---\n1 | 2')).not.toContain('<table>');
    // A thematic break is in neither profile's list.
    expect(html('---\n\ntext')).not.toContain('<hr');
  });

  /*
    Disabling a rule is not escaping. A fence has an inline rule waiting
    behind it - `backticks` - so it degrades to inline code rather than to
    literal backticks. Worth pinning: it is the one construct whose exclusion
    is visible as something other than its own source text.
  */
  it('degrades a fence to inline code rather than to literal backticks', () => {
    expect(html('```\ncode\n```')).toBe('<p><code>code</code></p>');
  });

  it('never renders an image', () => {
    const out = html('![alt](https://example.com/a.png)');
    expect(out).not.toContain('<img');
    expect(out).toContain('alt');
  });

  /* `html: false`: raw HTML is escaped text, never an element. */
  it('renders raw HTML as text', () => {
    const out = html('<b>hi</b> <script>alert(1)</script>');
    expect(out).not.toContain('<b>');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });

  it('escapes a dangerous character sequence inside inline code', () => {
    expect(html('`<script>`')).toBe('<p><code>&lt;script&gt;</code></p>');
  });
});

describe('the extended Markdown profile', () => {
  /* §10: extended adds headings, blockquotes, tables and fenced code. */
  it('adds exactly the four constructs the specification names', () => {
    const extended: MarkdownContext = { profile: 'extended' };
    expect(html('## Title', extended)).toBe('<h2>Title</h2>');
    expect(html('> quoted', extended)).toBe(
      '<blockquote><p>quoted</p></blockquote>'
    );
    expect(html('```\ncode\n```', extended)).toBe(
      '<pre><code>code\n</code></pre>'
    );
    expect(html('a | b\n--- | ---\n1 | 2', extended)).toContain('<table>');
  });

  it('still withholds images, raw HTML and thematic breaks', () => {
    const extended: MarkdownContext = { profile: 'extended' };
    expect(html('![alt](https://example.com/a.png)', extended)).not.toContain(
      '<img'
    );
    expect(html('<b>hi</b>', extended)).not.toContain('<b>');
    expect(html('---\n\ntext', extended)).not.toContain('<hr');
  });

  it('does not leak between profiles', () => {
    // The parsers are cached per profile; one must not reconfigure the other.
    expect(html('## Title', { profile: 'extended' })).toBe('<h2>Title</h2>');
    expect(html('## Title')).toBe('<p>## Title</p>');
    expect(html('## Title', { profile: 'extended' })).toBe('<h2>Title</h2>');
  });
});

describe('link targets pass the URL policy', () => {
  /* §10: "Markdown link targets MUST pass the URL policy." */
  it('renders an allowed link as an anchor', () => {
    expect(html('[go](https://example.com)')).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">go</a></p>'
    );
  });

  it('keeps the text and drops the link of a refused target', () => {
    const refused: string[] = [];
    const out = html('[go](javascript:alert(1))', {
      onRefusedUrl: (href) => refused.push(href),
    });
    expect(out).not.toContain('<a');
    expect(out).not.toContain('href');
    expect(out).toContain('go');
    expect(refused).toEqual(['javascript:alert(1)']);
  });

  it('honours a policy that narrows the default schemes', () => {
    const httpsOnly: MarkdownContext = {
      urlPolicy: {
        allowedSchemes: ['https'],
        allowRelative: false,
        allowImageDataUrls: false,
      },
    };
    expect(html('[go](https://example.com)', httpsOnly)).toContain('<a');
    expect(html('[go](http://example.com)', httpsOnly)).not.toContain('<a');
    expect(html('[go](./local)', httpsOnly)).not.toContain('<a');
  });

  /* A reference link and an autolink are links, and are policed like one. */
  it('polices a reference link and an autolink too', () => {
    expect(html('[go][ref]\n\n[ref]: https://example.com')).toContain(
      'href="https://example.com"'
    );
    const refused: string[] = [];
    const out = html('[go][ref]\n\n[ref]: javascript:alert(1)', {
      onRefusedUrl: (href) => refused.push(href),
    });
    expect(out).not.toContain('<a');
    expect(refused).toHaveLength(1);
    expect(html('<https://example.com>')).toContain(
      'href="https://example.com"'
    );
  });
});

describe('escaping an interpolated value', () => {
  /*
    §9: "Markdown substitutions are escaped before parsing." The order matters
    - escaping after parsing would be too late, the link already exists.
  */
  it('makes a substituted link render as its own characters', () => {
    const value = '[click](javascript:alert(1))';
    const out = html(`Hello ${escapeMarkdown(value)}`);
    expect(out).not.toContain('<a');
    expect(out).toContain('[click]');
    expect(out).toContain('javascript:alert(1)');
  });

  it('neutralizes emphasis, headings and code fences in a value', () => {
    expect(html(escapeMarkdown('**not bold**'))).toContain('**not bold**');
    expect(html(escapeMarkdown('# not a heading'))).toContain(
      '# not a heading'
    );
    expect(html(escapeMarkdown('`not code`'))).not.toContain('<code>');
  });

  it('leaves ordinary text alone once rendered', () => {
    expect(html(escapeMarkdown('Ana Petrova'))).toBe('<p>Ana Petrova</p>');
  });
});

describe('the parser itself', () => {
  it('is cached per profile', () => {
    expect(markdownParser('basic')).toBe(markdownParser('basic'));
    expect(markdownParser('basic')).not.toBe(markdownParser('extended'));
    expect(markdownParser()).toBe(markdownParser('basic'));
  });

  /*
    The guard for the "no HTML string" property: if this ever renders through
    `md.render()`, the walk below stops being the only path to the page.
  */
  it('produces React elements, not an HTML string', () => {
    const nodes = renderMarkdown('**bold**');
    expect(nodes).toHaveLength(1);
    expect(React.isValidElement(nodes[0])).toBe(true);
    expect((nodes[0] as React.ReactElement).type).toBe('p');
    expect(JSON.stringify(nodes[0]).includes('dangerouslySetInnerHTML')).toBe(
      false
    );
  });
});
