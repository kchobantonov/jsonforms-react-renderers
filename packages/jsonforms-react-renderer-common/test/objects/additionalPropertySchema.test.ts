import { createAjv } from '@jsonforms/core';
import { getMatchingAdditionalPropertySchema } from '../../src/objects/additionalProperties';

it('keeps every matching pattern constraint for a dynamic property', () => {
  const schema = {
    type: 'object',
    patternProperties: {
      '^entry': { type: 'string', minLength: 3 },
      '[Nn]ame$': { type: 'string', pattern: '^[A-Z]' },
    },
  } as const;
  const propertySchema = getMatchingAdditionalPropertySchema(
    'entryName',
    schema,
    schema,
    false,
  );
  const ajv = createAjv();
  expect(ajv.validate(propertySchema, 'Ada')).toBe(true);
  expect(ajv.validate(propertySchema, 'Al')).toBe(false);
  expect(ajv.validate(propertySchema, 'ada')).toBe(false);
});
