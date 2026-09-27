import { describe, expect, it } from 'vitest';
import {
  forSchema,
  type AuthoredSchema,
  type DataOf,
} from '@chobantonov/jsonforms-react-extended-renderers';

/*
  "Can I express everything the JSON way can?"

  This file is the answer, kept honest. Every element kind and awkward schema
  shape that a real form uses is built here; the `@ts-expect-error` lines mark
  the two things that are *not* expressible and cannot be, so that if either
  ever becomes possible the directive goes unused and the build fails.
*/

const schema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string' },
    kind: { type: 'string', enum: ['a', 'b'] },
    orders: {
      type: 'array',
      items: { type: 'object', properties: { ref: { type: 'string' } } },
    },
    extras: { type: 'object', additionalProperties: { type: 'string' } },
    choice: { oneOf: [{ type: 'string' }, { type: 'number' }] },
    tuple: { type: 'array', items: [{ type: 'string' }, { type: 'number' }] },
    home: { $ref: '#/$defs/addr' },
  },
  // `$defs` is why AuthoredSchema carries an index signature: JsonSchema7
  // declares draft-07's `definitions` and not this.
  $defs: { addr: { type: 'object', properties: { city: { type: 'string' } } } },
} as const satisfies AuthoredSchema;

const f = forSchema(schema);

describe('every element kind is expressible', () => {
  it('builds labels, categories, rules and the root scope', () => {
    const ui = f.layout({
      type: 'Categorization',
      elements: [
        f.category({
          label: 'Contact',
          elements: [
            f.label({ text: 'Tell us how to reach you' }),
            f.control('email', { i18n: 'email', label: { text: 'E', show: true } }),
            f.control('kind', {
              rule: {
                effect: 'HIDE',
                condition: {
                  type: 'AND',
                  conditions: [
                    { scope: f.scope('email'), schema: { minLength: 1 } },
                  ],
                },
              },
            }),
          ],
        }),
      ],
    });
    expect(ui.elements).toHaveLength(1);
  });

  it('addresses the root of the schema', () => {
    expect(f.control('')).toEqual({ type: 'Control', scope: '#' });
  });

  it('takes anything it does not model through `raw`', () => {
    // An extended element this module knows nothing about.
    const button = f.raw({ type: 'Button', label: 'Go', action: 'submit' });
    // An option the curated map does not carry - note the scope is still typed.
    const withOption = f.raw({
      type: 'Control',
      scope: f.scope('email'),
      options: { autocomplete: true },
    });
    expect(button.type).toBe('Button');
    expect(withOption.scope).toBe('#/properties/email');
  });
});

describe('the shapes that degrade rather than block', () => {
  type D = DataOf<typeof schema>;

  it('still addresses a combinator, a tuple, a map and a $ref as wholes', () => {
    expect([
      f.control('choice').scope,
      f.control('tuple').scope,
      f.control('extras').scope,
      f.control('home').scope,
    ]).toEqual([
      '#/properties/choice',
      '#/properties/tuple',
      '#/properties/extras',
      '#/properties/home',
    ]);
  });

  it('gives up on their data types rather than getting them wrong', () => {
    // Each of these is `unknown`-ish: no checking, but nothing is blocked.
    const combinator: D['choice'] = 'anything at all';
    const viaRef: D['home'] = { city: 'Sofia' };
    const dynamic: D['extras'] = { whatever: 'x' };
    expect([combinator, viaRef, dynamic]).toHaveLength(3);
  });

  it('cannot address what has no compile-time name', () => {
    // @ts-expect-error a dynamic property has no name until runtime
    f.control('extras.anything');
    // @ts-expect-error a combinator branch is not traversed
    f.control('choice.0');
    expect(true).toBe(true);
  });
});
