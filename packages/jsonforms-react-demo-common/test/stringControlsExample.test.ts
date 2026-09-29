import { describe, expect, test } from 'vitest';
import { createAjv } from '@jsonforms/core';
import examples, { isSpecExample } from '../src/examples';
import data from '@chobantonov/jsonforms-extended-spec/examples/string-controls/data.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/string-controls/schema.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/string-controls/translations.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/string-controls/uischema.json';

const example = examples.find((e) => e.name === 'spec-string-controls');

const controls = (uischema as any).elements.filter(
  (element: any) => element.type === 'Control'
);
const optionsFor = (property: string) =>
  controls.find((c: any) => c.scope === `#/properties/${property}`)?.options ??
  {};

describe('the string-controls spec example', () => {
  test('is registered into the demo list', () => {
    expect(example).toBeDefined();
    expect(example?.label).toBe('Spec: String controls');
    expect(isSpecExample(example!.name)).toBe(true);
  });

  /*
    The README states these two errors and explains why each is there. Verifying
    them here is what the spec-examples convention asks for - "validate the data
    against the schema and paste the real errors" - kept true after the fact
    rather than only at the moment it was written.
  */
  test('produces exactly the two errors its README documents', () => {
    const ajv = createAjv();
    const validate = ajv.compile(schema as any);
    expect(validate(data)).toBe(false);
    expect(
      (validate.errors ?? []).map((error) => [
        error.instancePath,
        error.keyword,
      ])
    ).toEqual([
      ['/gateCode', 'pattern'],
      ['/legacyReference', 'pattern'],
    ]);
  });

  test('keeps an incomplete value that the mask itself accepts', () => {
    // `814` masks to `81-4` with nothing rejected. A mask guides structure and
    // does not prove completeness, so the error above is the validator's to
    // report and the field is not withholding anything.
    expect(data.gateCode).toBe('814');
    expect(optionsFor('gateCode').mask).toBe('##-##');
  });

  test('holds a value no mask can carry, for the verbatim case', () => {
    expect(data.legacyReference).toBe('PENDING-REVIEW');
    expect(optionsFor('legacyReference').mask).toBe('###-###');
  });

  test('carries the boolean temporal opt-out that must not select a mask', () => {
    expect(optionsFor('scheduledMeeting').mask).toBe(false);
    expect((schema as any).properties.scheduledMeeting.format).toBe('date');
  });

  test('stores the separators only where returnMaskedValue asks for it', () => {
    expect(optionsFor('contactPhone').returnMaskedValue).toBe(true);
    expect(data.contactPhone).toBe('+1 (503) 555-0142');

    expect(optionsFor('bookingReference').returnMaskedValue).toBeUndefined();
    expect(data.bookingReference).toBe('482913');
  });

  test('puts the family-convention options at the top level of config', () => {
    // Adjustment 1 and 11.9: these come from the inspected Vuetify/Svelte
    // families, so they are not namespaced.
    const config = example?.config as any;
    expect(config.restrict).toBe(true);
    expect(config.clearable).toBe(true);
    expect(config.jsonformsExtended).toBeUndefined();
  });

  test('ships both catalogs with matching keys', () => {
    expect(Object.keys(translations).sort()).toEqual(['bg', 'en']);
    expect(Object.keys(translations.bg).sort()).toEqual(
      Object.keys(translations.en).sort()
    );
  });
});
