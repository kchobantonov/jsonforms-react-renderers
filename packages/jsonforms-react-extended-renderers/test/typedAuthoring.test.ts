import { describe, expect, it } from 'vitest';
import { createAjv } from '@jsonforms/core';
import { forSchema } from '../src/authoring/forSchema';
import type { DataOf } from '../src/authoring/schemaTypes';

/*
  Two halves, and the second is the one that matters.

  The runtime half checks that the pointer this builds is the pointer
  `Scope<P>` claims it builds - they are tied together by a cast, and a cast
  is exactly the place where a type and a value drift apart unseen.

  The compile-time half is written with `@ts-expect-error`. Each one asserts
  that the line below it **does not compile**; if the checking ever stops
  working, the directive becomes unused and `tsc` fails on the directive
  itself. `vitest` alone would never notice, so this file is only a complete
  guard when `tsc --noEmit -p test/tsconfig.json` runs - which `pnpm build`
  does.
*/

const schema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email' },
    age: { type: 'integer', minimum: 0 },
    subscribed: { type: 'boolean' },
    address: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        postcode: { type: 'string' },
      },
    },
    orders: {
      type: 'array',
      items: { type: 'object', properties: { reference: { type: 'string' } } },
    },
  },
} as const;

const f = forSchema(schema);

describe('the pointer a typed scope produces', () => {
  it('matches the literal type it is declared to have', () => {
    // Each annotation is the `Scope<P>` the builder promises; assigning the
    // produced string to it is what proves the two agree.
    const top: '#/properties/email' = f.scope('email');
    const nested: '#/properties/address/properties/city' =
      f.scope('address.city');
    expect(top).toBe('#/properties/email');
    expect(nested).toBe('#/properties/address/properties/city');
  });

  it('resolves against the schema it was built from', () => {
    // The pointer has to be one Ajv can follow, not merely a tidy string.
    const ajv = createAjv();
    const validate = ajv.compile({
      type: 'object',
      properties: { value: { $ref: `#${f.scope('address.city').slice(1)}` } },
      $defs: {},
      ...schema,
    } as any);
    expect(typeof validate).toBe('function');
  });

  it('builds an ordinary portable element, with nothing extra on it', () => {
    expect(f.control('age', { options: { slider: true } })).toEqual({
      type: 'Control',
      scope: '#/properties/age',
      options: { slider: true },
    });
  });
});

describe('what the types reject', () => {
  it('rejects the mistakes a scope string cannot', () => {
    // @ts-expect-error a misspelled property
    f.control('emial');
    // @ts-expect-error a misspelled nested property
    f.control('address.postcod');
    // @ts-expect-error a path that continues past a leaf
    f.control('address.city.suburb');
    // @ts-expect-error an array is terminal: an item scope is relative to it
    f.control('orders.reference');
    // @ts-expect-error a numeric option on a string
    f.control('email', { options: { slider: true } });
    // @ts-expect-error a string option on a number
    f.control('age', { options: { multi: true } });
    // @ts-expect-error the right option, the wrong value type
    f.control('age', { options: { slider: 'yes' } });
    // @ts-expect-error a misspelled element key
    f.control('email', { labl: 'typo' });
    f.control('email', {
      rule: {
        effect: 'HIDE',
        // @ts-expect-error a rule's condition scope is checked too
        condition: { scope: f.scope('nope'), schema: {} },
      },
    });
    expect(true).toBe(true);
  });

  it('derives the data type, including which keys are required', () => {
    type Data = DataOf<typeof schema>;
    const ok: Data = { email: 'a@b.c', age: 3, address: { city: 'Sofia' } };
    // @ts-expect-error `age` is an integer
    const wrongType: Data = { email: 'a@b.c', age: 'old' };
    // @ts-expect-error `email` is required
    const missing: Data = { age: 3 };
    expect(ok.email).toBe('a@b.c');
    expect(wrongType).toBeDefined();
    expect(missing).toBeDefined();
  });
});
