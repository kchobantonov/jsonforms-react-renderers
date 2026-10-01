import { expect, it } from 'vitest';
import { validateAdditionalPropertyName } from '../src/additionalPropertyName';
it('checks full property-name constraints for new and unchanged rename drafts without an injected validator', () => {
  const schema = {
    type: 'object',
    propertyNames: { pattern: '^sensor-', minLength: 9 },
  };
  const check = (name: string, currentName?: string) =>
    validateAdditionalPropertyName({
      name,
      currentName,
      schema,
      rootSchema: schema,
    });
  expect(check('sensor-x').errors?.map((error) => error.keyword)).toContain(
    'minLength'
  );
  expect(
    check('a-very-long-name').errors?.map((error) => error.keyword)
  ).toContain('pattern');
  expect(check('sensor-x', 'sensor-x').error).toBe('invalid');
  expect(check('sensor-xy').error).toBeUndefined();
});
