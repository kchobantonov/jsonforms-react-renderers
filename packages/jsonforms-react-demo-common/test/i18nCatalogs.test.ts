import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, test } from 'vitest';
import {
  asTranslationCatalogs,
  exampleTranslations,
  i18nEditorValue,
  translatorFor,
} from '../src/i18nCatalogs';
import examples from '../src/examples';
import { stringifyEditorValue } from '../src/editorModels';

const spec = examples.find(
  (e) => e.name === 'spec-container-validation-indicator'
)!;

const translationsFile = join(
  __dirname,
  '../src/examples/spec/container-validation-indicator/translations.json'
);

describe('the Internationalization tab shows translations.json verbatim', () => {
  test('the editor value is exactly the file contents', () => {
    const onDisk = JSON.parse(readFileSync(translationsFile, 'utf8'));
    expect(i18nEditorValue(spec)).toEqual(onDisk);
  });

  test('no wrapper: the top level is the locale codes', () => {
    const shown = JSON.parse(stringifyEditorValue(i18nEditorValue(spec)));
    expect(Object.keys(shown).sort()).toEqual(['bg', 'en']);
    expect(shown.locale).toBeUndefined();
    expect(shown.translations).toBeUndefined();
    expect(shown.en['error.required']).toBe('This field is required.');
  });

  test('a translate function alone still serializes to just its locale', () => {
    // The original complaint, for an example that carries no catalogs.
    const value = stringifyEditorValue({ locale: 'en', translate: () => 'x' });
    expect(JSON.parse(value)).toEqual({ locale: 'en' });
  });

  test('an example without catalogs keeps the previous behavior', () => {
    const plain = { name: 'x', label: 'x', data: {}, schema: {}, uischema: {} };
    expect(exampleTranslations(plain as any)).toBeUndefined();
    expect(i18nEditorValue(plain as any)).toBeUndefined();
  });
});

describe('reading an edited document', () => {
  test('round trips the catalogs', () => {
    const edited = JSON.parse(stringifyEditorValue(i18nEditorValue(spec)));
    expect(asTranslationCatalogs(edited)).toEqual(edited);
  });

  test('rejects a legacy i18n document so the caller can fall back', () => {
    expect(asTranslationCatalogs({ locale: 'en' })).toBeUndefined();
  });

  test('rejects shapes that are not catalogs', () => {
    expect(asTranslationCatalogs(undefined)).toBeUndefined();
    expect(asTranslationCatalogs(null)).toBeUndefined();
    expect(asTranslationCatalogs('en')).toBeUndefined();
    expect(asTranslationCatalogs([])).toBeUndefined();
    expect(asTranslationCatalogs({})).toBeUndefined();
    expect(asTranslationCatalogs({ en: 'not a catalog' })).toBeUndefined();
    expect(asTranslationCatalogs({ en: {}, bg: 'mixed' })).toBeUndefined();
  });

  test('accepts an edited message', () => {
    const catalogs = asTranslationCatalogs({
      en: { 'error.required': 'Please fill this in.' },
    })!;
    expect(translatorFor(catalogs, 'en')('error.required', 'fb')).toBe(
      'Please fill this in.'
    );
  });
});

describe('the locale switcher picks the catalog', () => {
  const catalogs = exampleTranslations(spec)!;

  test('each locale resolves its own messages', () => {
    expect(translatorFor(catalogs, 'en')('error.required', 'fb')).toBe(
      'This field is required.'
    );
    expect(translatorFor(catalogs, 'bg')('error.required', 'fb')).toBe(
      'Полето е задължително.'
    );
  });

  test('an unknown locale falls back to the supplied default', () => {
    expect(translatorFor(catalogs, 'de')('error.required', 'fb')).toBe('fb');
    // undefined, not the key: returning the key would stop core's error
    // lookup chain early.
    expect(translatorFor(catalogs, 'de')('error.required')).toBeUndefined();
  });

  test('both catalogs carry the same keys', () => {
    expect(Object.keys(catalogs.bg).sort()).toEqual(
      Object.keys(catalogs.en).sort()
    );
  });
});
