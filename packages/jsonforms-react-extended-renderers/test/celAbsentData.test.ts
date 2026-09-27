import { describe, expect, it } from 'vitest';
import { renderTemplate, resolveTextParams } from '../src/util/celTemplate';
import {
  buildNamespaceScope,
  buildTextScope,
  splitTemplate,
} from '../src/util/interpolate';

/**
 * Absent data is not an authoring error.
 *
 * A form being filled in is mostly empty, so an expression reaching a field
 * nobody has typed into yet is the normal case rather than a fault. Reporting
 * it would put a developer-facing message beside half the labels on a fresh
 * form, which is how people learn to ignore diagnostics.
 *
 * What stays an error is anything wrong *however* the form is filled in: a
 * name that is not declared, a function that does not exist, a type mismatch.
 */

const render = (
  template: string,
  params: Record<string, unknown>,
  data: unknown
) => {
  const ns = buildNamespaceScope({ data, locale: 'en', dynamicAllowed: true });
  const resolved = resolveTextParams(params, ns, 'en');
  const out = renderTemplate(
    splitTemplate(template),
    buildTextScope(resolved.params, 'en'),
    undefined,
    'en'
  );
  return { text: out.text, failures: [...resolved.failures, ...out.failures] };
};

describe('data that is not there yet', () => {
  it.each([
    ['a field nobody has filled in', '{data.promoCode}', {}],
    ['a missing object on the way', '{data.billing.city}', {}],
    [
      'a key under a value that is not a map',
      '{data.name.city}',
      { name: 'Ana' },
    ],
    ['an index past the end of a list', '{data.items[4]}', { items: [1, 2] }],
    ['an explicit null', '{data.middleName}', { middleName: null }],
  ])('renders empty and says nothing: %s', (_label, expression, data) => {
    const out = render('Value: {v}', { v: expression }, data);
    expect(out.text).toBe('Value: ');
    expect(out.failures).toEqual([]);
  });

  it('does not report an optional value inside a sentence', () => {
    const out = render(
      '{greeting}, {name}!',
      { greeting: 'Hello', name: '{data.firstName}' },
      {}
    );
    expect(out.text).toBe('Hello, !');
    expect(out.failures).toEqual([]);
  });
});

describe('what stays an authoring error', () => {
  it.each([
    ['a namespace that does not exist', '{nowhere.field}'],
    ['a function that does not exist', '{frobnicate(1)}'],
    ['a type mismatch', '{data.name + 1}'],
  ])('reports %s', (_label, expression) => {
    const out = render('Value: {v}', { v: expression }, { name: 'Ana' });
    expect(out.failures).toHaveLength(1);
    expect(out.text).toBe('Value: ');
  });

  /*
    The one that belongs to the text rather than to the data: a name the
    element never declared. Wrong however the form is filled in, so it is
    reported - and it is the reason the text scope is closed.
  */
  it('reports a parameter the element never declared', () => {
    const out = render('Value: {undeclared}', { declared: 'x' }, {});
    expect(out.failures).toHaveLength(1);
    expect(out.failures[0]).toContain('undeclared');
  });
});

describe('a property named "constructor"', () => {
  /*
    A legal JSON key that the evaluator cannot read as a plain object: its
    type check is `switch (v.constructor)`, which a data key of that name
    shadows, and it rejects the **whole map** - every sibling field goes with
    it. Only `constructor` does this; `__proto__`, `toString`, `valueOf` and
    `hasOwnProperty` as data keys are fine.

    Data is read the way JSON means it, so the evaluation is retried with the
    objects rebuilt as maps, whose entries cannot shadow `.constructor`. The
    retry runs only after that specific failure, so ordinary data is never
    walked or converted.
  */
  const withConstructor = JSON.parse('{"normal":"n","constructor":"c"}');

  it('does not stop its siblings being read', () => {
    const out = render('Value: {v}', { v: '{data.normal}' }, withConstructor);
    expect(out.text).toBe('Value: n');
    expect(out.failures).toEqual([]);
  });

  it('is itself readable, like any other JSON key', () => {
    const out = render(
      'Value: {v}',
      { v: '{data.constructor}' },
      withConstructor
    );
    expect(out.text).toBe('Value: c');
    expect(out.failures).toEqual([]);
  });

  it('works nested, and leaves the rest of the data intact', () => {
    const data = JSON.parse(
      '{"billing":{"constructor":"nc","city":"Sofia"},"items":[1,2],"n":null}'
    );
    expect(render('{v}', { v: '{data.billing.city}' }, data).text).toBe(
      'Sofia'
    );
    expect(render('{v}', { v: '{data.billing.constructor}' }, data).text).toBe(
      'nc'
    );
    expect(render('{v}', { v: '{data.items[1]}' }, data).text).toBe('2');
    // Absent-key semantics survive the repair.
    expect(render('{v}', { v: '{data.billing.nope}' }, data).failures).toEqual(
      []
    );
  });

  it.each([
    ['__proto__', '{"normal":"n","__proto__":"p"}'],
    ['toString', '{"normal":"n","toString":"t"}'],
    ['valueOf', '{"normal":"n","valueOf":"v"}'],
    ['hasOwnProperty', '{"normal":"n","hasOwnProperty":"h"}'],
  ])('needs no repair for a property named %s', (_label, json) => {
    const out = render('Value: {v}', { v: '{data.normal}' }, JSON.parse(json));
    expect(out.text).toBe('Value: n');
    expect(out.failures).toEqual([]);
  });
});
