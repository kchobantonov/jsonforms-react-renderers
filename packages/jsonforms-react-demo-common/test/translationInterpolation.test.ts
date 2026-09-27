import { describe, expect, test } from 'vitest';
import { defaultErrorTranslator } from '@jsonforms/core';
import { translatorFor } from '../src/i18nCatalogs';
import translations from '../src/examples/spec/numeric-controls/translations.json';

/** The shape ajv produces, which core hands the translator as `{ error }`. */
const ajvError = (
  keyword: string,
  params: Record<string, unknown>,
  instancePath = '/x'
) => ({ keyword, params, instancePath, schemaPath: '#', message: 'raw' } as any);

const translate = (locale: string) =>
  translatorFor(translations as any, locale);

describe('catalog interpolation', () => {
  test('fills {limit} from error.params, in both locales', () => {
    const error = ajvError('minimum', { comparison: '>=', limit: 1 });
    expect(defaultErrorTranslator(error, translate('en'), undefined as any)).toBe(
      'Enter a value of at least 1.'
    );
    expect(defaultErrorTranslator(error, translate('bg'), undefined as any)).toBe(
      'Въведете стойност поне 1.'
    );
  });

  test('fills {multipleOf}', () => {
    const error = ajvError('multipleOf', { multipleOf: 2 });
    expect(defaultErrorTranslator(error, translate('bg'), undefined as any)).toBe(
      'Въведете число, кратно на 2.'
    );
  });

  test('fills the exclusive bound', () => {
    const error = ajvError('exclusiveMinimum', { comparison: '>', limit: 0 });
    expect(defaultErrorTranslator(error, translate('bg'), undefined as any)).toBe(
      'Въведете стойност по-голяма от 0.'
    );
  });

  test('leaves no raw placeholders in any catalog message', () => {
    // The defect this guards: core does no interpolation of its own, so a
    // catalog entry rendered without substitution shows "{limit}" to the user.
    const error = ajvError('minimum', { comparison: '>=', limit: 5 });
    for (const locale of ['en', 'bg']) {
      const rendered = defaultErrorTranslator(
        error,
        translate(locale),
        undefined as any
      );
      expect(rendered).not.toMatch(/\{[a-z]+\}/i);
    }
  });

  test('keeps an unknown placeholder visible rather than blanking it', () => {
    const t = translatorFor({ en: { 'error.x': 'a {nope} b' } }, 'en');
    expect(t('error.x', undefined, { error: { params: {} } })).toBe('a {nope} b');
  });

  test('still returns the fallback for a key the catalog lacks', () => {
    // Returning the key instead would stop core's lookup chain early.
    const t = translatorFor({ en: {} }, 'en');
    expect(t('error.missing', 'fallback')).toBe('fallback');
    expect(t('error.missing')).toBeUndefined();
  });
});
