import { describe, expect, it } from 'vitest';
import { createAjv } from '@jsonforms/core';
import {
  forSchema,
  type AuthoredSchema,
} from '@chobantonov/jsonforms-react-extended-renderers';

/*
  Property names that collide with the addressing scheme.

  Three separate problems wearing the same clothes, and they do not have the
  same answer:

  - `properties` as a *name* is fine. `#/properties/properties` is the
    keyword followed by the property, and nothing is ambiguous.
  - `/` and `~` are legal in a pointer once escaped (RFC 6901), so they stay
    addressable - the escaping is done for you, the same way core's own
    `getPropPath` does it.
  - `.` has no escape in JSON Forms' path grammar, so such a property has no
    scope at all. It is left out of the offered paths rather than given a
    pointer that resolves to nothing.
*/

const schema = {
  type: 'object',
  properties: {
    // A property literally named `properties`, itself an object.
    properties: { type: 'object', properties: { city: { type: 'string' } } },
    // The two characters JSON Pointer reserves.
    'a/b': { type: 'string' },
    'c~d': { type: 'string' },
    // Names that look like schema keywords but are only names here.
    items: { type: 'string' },
    type: { type: 'string' },
    // Not addressable: the path grammar has no escape for a dot.
    'first.name': { type: 'string' },
  },
} as const satisfies AuthoredSchema;

const f = forSchema(schema);

/** Follows a `#/...` pointer by hand, decoding per RFC 6901. */
const resolve = (pointer: string): unknown =>
  pointer
    .slice(2)
    .split('/')
    .reduce<any>(
      (node, raw) => node?.[raw.replace(/~1/g, '/').replace(/~0/g, '~')],
      schema
    );

describe('property names that collide with the addressing scheme', () => {
  it('addresses a property named `properties`, nested or not', () => {
    expect(f.scope('properties')).toBe('#/properties/properties');
    expect(f.scope('properties.city')).toBe(
      '#/properties/properties/properties/city'
    );
    // And both pointers land on a real sub-schema.
    expect(resolve(f.scope('properties.city'))).toEqual({ type: 'string' });
  });

  it('escapes the two characters a pointer reserves', () => {
    expect(f.scope('a/b')).toBe('#/properties/a~1b');
    expect(f.scope('c~d')).toBe('#/properties/c~0d');
    // Unescaped, `#/properties/a/b` would walk into a property called `a`.
    expect(resolve(f.scope('a/b'))).toEqual({ type: 'string' });
    expect(resolve(f.scope('c~d'))).toEqual({ type: 'string' });
  });

  it('addresses names that merely look like keywords', () => {
    expect(resolve(f.scope('items'))).toEqual({ type: 'string' });
    expect(resolve(f.scope('type'))).toEqual({ type: 'string' });
  });

  it('refuses a name containing a dot instead of mis-addressing it', () => {
    // @ts-expect-error `first.name` has no scope: the grammar has no escape
    f.scope('first.name');
    /*
      What the wrong answer would have been. Left as an assertion because it
      is the reason for the refusal: the pointer is well-formed, resolves to
      nothing, and reports no error anywhere.
    */
    expect(resolve('#/properties/first/properties/name')).toBeUndefined();
  });

  it('still validates such data - the name is legal, only unaddressable', () => {
    const validate = createAjv().compile(schema as any);
    expect(validate({ 'first.name': 'Ada', 'a/b': 'x' })).toBe(true);
  });
});
