import { describe, expect, it } from 'vitest';
import React from 'react';
import { JsonForms } from '@jsonforms/react';
import {
  asJsonSchema,
  asUiSchema,
  forSchema,
  type AuthoredSchema,
  type DataOf,
} from '@chobantonov/jsonforms-extended-spec/typescript';

const schema = {
  type: 'object',
  required: ['email'],
  properties: { email: { type: 'string' }, age: { type: 'integer' } },
} as const satisfies AuthoredSchema;

const f = forSchema(schema);
const uischema = f.layout({
  type: 'VerticalLayout',
  elements: [
    f.control('email'),
    f.control('age', { options: { slider: true } }),
  ],
});
type Data = DataOf<typeof schema>;
const data: Data = { email: 'a@b.c' };

/*
  The guide's worked example, compiled from the package's public entry point
  rather than from source paths - which is the only way to catch an export
  that was never added to `index`.

  The `<JsonForms>` element is the part worth pinning: `schema={schema}` does
  not compile, because `as const` makes every array readonly and `JsonSchema`
  wants mutable ones, and neither does `schema as JsonSchema` - TypeScript
  refuses a direct cast between types that do not sufficiently overlap. If
  `asJsonSchema` ever stops being needed, or stops being enough, this file is
  where it shows up.
*/
const Form = () => (
  <JsonForms
    schema={asJsonSchema(schema)}
    uischema={asUiSchema(uischema)}
    data={data}
    renderers={[]}
    onChange={() => undefined}
  />
);

describe('the typed authoring guide', () => {
  it('produces the portable elements it claims to', () => {
    expect(uischema).toEqual({
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/email' },
        {
          type: 'Control',
          scope: '#/properties/age',
          options: { slider: true },
        },
      ],
    });
  });

  it('keeps the schema usable as a schema', () => {
    expect(asJsonSchema(schema)).toBe(schema);
    expect(typeof Form).toBe('function');
  });
});
