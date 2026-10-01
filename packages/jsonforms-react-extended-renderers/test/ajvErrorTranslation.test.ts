import { expect, it } from 'vitest';
import { createAjvErrorTranslator } from '../src/core/ajvI18n';

it('prefers field-specific messages while retaining localized AJV fallback', () => {
  const error: any = {
    keyword: 'contains',
    instancePath: '/reviewers',
    schemaPath: '#/properties/reviewers/contains',
    params: {},
    message: 'must contain a valid item',
  };
  const translateError = createAjvErrorTranslator(
    {
      en: (errors: any[]) => {
        errors[0].message = 'localized fallback';
      },
    },
    () => 'en'
  );
  expect(
    translateError(
      error,
      (key, fallback) =>
        key === 'reviewers.error.contains'
          ? 'Select Lead for at least one reviewer.'
          : fallback,
      undefined
    )
  ).toBe('Select Lead for at least one reviewer.');
  expect(translateError(error, (_key, fallback) => fallback, undefined)).toBe(
    'localized fallback'
  );
  expect(error.message).toBe('must contain a valid item');
});
