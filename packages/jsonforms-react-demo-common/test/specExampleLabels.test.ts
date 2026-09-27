import { describe, expect, test } from 'vitest';
import { deriveLabelForUISchemaElement } from '@jsonforms/core';
import { translatorFor } from '../src/i18nCatalogs';
import translations from '../src/examples/spec/container-validation-indicator/translations.json';
import uischema from '../src/examples/spec/container-validation-indicator/uischema.json';

const categories = (uischema as any).elements[1].elements;
const group = categories[0].elements[1];
const label = (element: any, locale: string) =>
  deriveLabelForUISchemaElement(element, translatorFor(translations, locale));

describe('unbound elements need an explicit i18n prefix', () => {
  test('a Group has no scope, so only uischema.i18n supplies the prefix', () => {
    // getI18nKeyPrefixBySchema(undefined, uischema) has no schema to fall back
    // on. Without `i18n` the lookup key is the raw label text, so a catalog
    // entry keyed `emergencyContact.label` is never consulted.
    expect(group.i18n).toBe('emergencyContact');
    expect(label(group, 'en')).toBe('Emergency contact');
    expect(label(group, 'bg')).toBe('Лице за контакт при спешност');
  });

  test('without i18n the same Group falls back to its literal label', () => {
    const { i18n: _dropped, ...noPrefix } = group;
    expect(label(noPrefix, 'bg')).toBe('Emergency contact');
  });

  test('Categories are unbound too and carry their own prefixes', () => {
    expect(categories.map((c: any) => c.i18n)).toEqual([
      'personalDetails',
      'compliance',
    ]);
    expect(categories.map((c: any) => label(c, 'bg'))).toEqual([
      'Лични данни',
      'Съответствие',
    ]);
  });

  test('every authored i18n prefix has a .label entry in both locales', () => {
    const prefixes = [group.i18n, ...categories.map((c: any) => c.i18n)];
    for (const locale of ['en', 'bg'] as const) {
      for (const prefix of prefixes) {
        expect(
          (translations as any)[locale][`${prefix}.label`]
        ).toBeTruthy();
      }
    }
  });
});
