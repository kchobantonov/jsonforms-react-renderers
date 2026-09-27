import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { renderTemplate, resolveTextParams } from '../src/util/celTemplate';
import {
  buildNamespaceScope,
  buildTextScope,
  splitTemplate,
} from '../src/util/interpolate';
import { escapeMarkdown, renderMarkdown } from '../src/util/markdown';

/**
 * What an expression in a label can and cannot do.
 *
 * Every claim here is a property the implementation depends on rather than a
 * restatement of the library's documentation, so each one is exercised
 * against the evaluator that actually ships.
 */

/**
 * The two levels, the way the renderer runs them: parameters are resolved
 * against the namespaces, then the text is resolved against the parameters.
 * The text never sees a namespace, which is what these tests mostly check.
 */
const render = (
  template: string,
  namespaceScope: Record<string, unknown>,
  textParams?: Record<string, unknown>,
  escape?: (text: string) => string
) => {
  const resolved = resolveTextParams(textParams, namespaceScope);
  const rendered = renderTemplate(
    splitTemplate(template),
    buildTextScope(resolved.params, 'en'),
    escape
  );
  return {
    text: rendered.text,
    failures: [...resolved.failures, ...rendered.failures],
  };
};

/** A parameter whose value is the expression under test. */
const viaParam = (
  expression: string,
  namespaceScope: Record<string, unknown>
) => render('{v}', namespaceScope, { v: `{${expression}}` });

describe('CEL cannot reach the host', () => {
  /*
    The reason this needs no `allowScriptEvaluation` gate. The criterion in
    Adjustment 35.2 is that a gate defaults closed when what it opens can
    *act*; these are the probes that decide which side of that line CEL is on.
  */
  it.each([
    ['a JavaScript function', 'alert("x")'],
    ['a module loader', 'require("fs")'],
    ['a method on a value', 'data.toString()'],
    ['an assignment', 'data.x = 1'],
    ['a statement', 'while (true)'],
  ])('refuses %s', (_label, expression) => {
    const result = viaParam(
      expression,
      buildNamespaceScope({ data: { x: 1 }, dynamicAllowed: true })
    );
    expect(result.failures).toHaveLength(1);
    expect(result.text).toBe('');
  });

  /*
    Prototype access is refused as an *absent key*, because that is exactly
    what it is: own-property lookup finds no `constructor` on the map. It is
    therefore silent, like any other missing key - and silence is fine here,
    because the security property is that nothing is returned, not that
    something is said. Asserting the diagnostic instead of the refusal would
    pin the wrong thing.
  */
  it.each([
    ['the constructor', 'data.constructor'],
    ['the prototype', 'data.__proto__'],
    ['a prototype method', 'data.hasOwnProperty'],
  ])('yields nothing for %s', (_label, expression) => {
    const result = viaParam(
      expression,
      buildNamespaceScope({ data: { x: 1 }, dynamicAllowed: true })
    );
    expect(result.text).toBe('');
  });

  it('cannot see a namespace the gate withholds', () => {
    const shut = buildNamespaceScope({ dynamicAllowed: false });
    expect(Object.keys(shut)).toEqual(['locale']);
    const result = viaParam('data.secret', shut);
    expect(result.failures).toHaveLength(1);
    expect(result.text).toBe('');
  });

  it('sees the data namespace once the gate is open', () => {
    const open = buildNamespaceScope({
      data: { secret: 'shown' },
      dynamicAllowed: true,
    });
    expect(viaParam('data.secret', open).text).toBe('shown');
  });

  /*
    The property the catalog depends on: a namespace is reachable from a
    parameter's value and from nowhere else. A translated string cannot name a
    data path even with the gate wide open, which is what stops a catalog
    depending on the schema.
  */
  it('withholds every namespace from the TEXT, gate open or not', () => {
    const open = buildNamespaceScope({
      data: { secret: 'shown' },
      dynamicAllowed: true,
    });
    const direct = render('Value: {data.secret}', open);
    expect(direct.text).toBe('Value: ');
    expect(direct.failures.join(' ')).toContain('data');
    // Declared as a parameter, the same value resolves.
    expect(render('Value: {v}', open, { v: '{data.secret}' }).text).toBe(
      'Value: shown'
    );
  });

  /* Parameters see the namespaces, never each other. */
  it('does not let one parameter reference another', () => {
    const open = buildNamespaceScope({ data: { a: 1 }, dynamicAllowed: true });
    const result = render('{second}', open, {
      first: '{data.a}',
      second: '{first}',
    });
    expect(result.failures.join(' ')).toContain('first');
    expect(result.text).toBe('');
  });

  /* Non-Turing-complete by design; this is the DoS surface, and it is bounded. */
  it('terminates on a macro over a large list', () => {
    const scope = buildNamespaceScope({
      data: { items: Array.from({ length: 5000 }, (_, i) => i) },
      dynamicAllowed: true,
    });
    const started = Date.now();
    const result = viaParam('data.items.all(i, i >= 0)', scope);
    expect(result.text).toBe('true');
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

describe('a substituted value cannot become markup', () => {
  const scope = (value: unknown) =>
    buildNamespaceScope({ data: { v: value }, dynamicAllowed: true });

  /* The pipeline: interpolate -> escape the VALUE -> parse. */
  const asMarkdown = (template: string, value: unknown) => {
    const { text } = render(
      '{v}',
      scope(value),
      { v: '{data.v}' },
      escapeMarkdown
    );
    void template;
    return renderMarkdown(text);
  };

  /*
    The rendered markup, not the React tree. Whether `<script>` appears in a
    node's JSON says nothing - a text node holding those characters is inert.
    The question is only ever what reaches the DOM, so the nodes are
    serialized the way React would render them.
  */
  const html = (nodes: React.ReactNode[]) => renderToStaticMarkup(<>{nodes}</>);

  it('does not turn a value into a link', () => {
    const out = html(asMarkdown('{data.v}', '[click](javascript:alert(1))'));
    expect(out).not.toContain('<a ');
    expect(out).toContain('[click]');
  });

  it('does not turn a value into emphasis or a heading', () => {
    expect(html(asMarkdown('{data.v}', '**bold**'))).not.toContain('<strong>');
    expect(html(asMarkdown('{data.v}', '**bold**'))).toContain('**bold**');
    expect(html(asMarkdown('{data.v}', '# Heading'))).not.toContain('<h1>');
  });

  it('does not let a value inject raw HTML', () => {
    const out = html(asMarkdown('{data.v}', '<script>alert(1)</script>'));
    // No element - the characters survive, escaped, as text.
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;script&gt;');
  });

  /*
    The same check without any Markdown at all. `escapeMarkdown` does not
    touch `<` or `>`, and it does not need to: the value becomes a React text
    node, and React escapes it on render. This pins that reasoning rather
    than trusting it.
  */
  it('escapes raw HTML in plain text too, by being text', () => {
    const { text } = render('Hi {v}', scope('<img src=x onerror=alert(1)>'), {
      v: '{data.v}',
    });
    const out = renderToStaticMarkup(<span>{text}</span>);
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
  });

  /*
    The other half, and the reason the escaping is per-segment: the author's
    OWN markup in the literal text must still work. Escaping the finished
    string would kill it; escaping nothing would allow the attacks above.
  */
  it("keeps the author's own markup working around the value", () => {
    const { text } = render(
      '**Welcome**, {v}!',
      scope('*not emphasis*'),
      { v: '{data.v}' },
      escapeMarkdown
    );
    const out = html(renderMarkdown(text));
    // The author's bold survives...
    expect(out).toContain('<strong>Welcome</strong>');
    // ...and the value's asterisks are text.
    expect(out).not.toContain('<em>');
    expect(out).toContain('*not emphasis*');
  });

  /*
    Belt and braces: an author interpolating INTO a link destination is not
    protected by value escaping alone, because the destination is the
    author's own markup. The URL policy is what catches it, and it is
    authoritative for exactly this reason.
  */
  it("still refuses a dangerous URL interpolated into the author's own link", () => {
    const { text } = render(
      '[docs]({v})',
      scope('javascript:alert(1)'),
      { v: '{data.v}' },
      escapeMarkdown
    );
    const out = html(renderMarkdown(text));
    // No anchor, and no javascript: destination anywhere in the output.
    expect(out).not.toContain('<a ');
    expect(out).not.toContain('href');
  });
});

describe('without Markdown there is nothing to escape', () => {
  /*
    The value becomes a React text node, and React escapes text nodes. The
    escape hook is therefore identity here - passing `escapeMarkdown` would
    put visible backslashes in front of ordinary punctuation.
  */
  it('leaves punctuation alone when the result is plain text', () => {
    const { text } = render(
      'Hello {v}',
      buildNamespaceScope({
        data: { v: 'Ana (she/her) - welcome!' },
        dynamicAllowed: true,
      }),
      { v: '{data.v}' }
    );
    expect(text).toBe('Hello Ana (she/her) - welcome!');
    expect(text).not.toContain('\\');
  });
});
