import { describe, expect, test } from 'vitest';
import { createAjv } from '@jsonforms/core';
import examples, { isSpecExample } from '../src/examples';
import data from '../src/examples/spec/array-choices/data.json';
import schema from '../src/examples/spec/array-choices/schema.json';
import translations from '../src/examples/spec/array-choices/translations.json';
import uischema from '../src/examples/spec/array-choices/uischema.json';
import choiceUischema from '../src/examples/spec/choice-controls/uischema.json';
import choiceSchema from '../src/examples/spec/choice-controls/schema.json';

const optionsFor = (doc: any, property: string) =>
  doc.elements.find((e: any) => e.scope === `#/properties/${property}`)
    ?.options ?? {};

describe('the array-choices spec example', () => {
  const example = examples.find((e) => e.name === 'spec-array-choices');

  test('is registered into the demo list', () => {
    expect(example).toBeDefined();
    expect(example?.label).toBe('Spec: Array choices and tokens');
    expect(isSpecExample(example!.name)).toBe(true);
  });

  test('produces exactly the two errors its README documents', () => {
    const validate = createAjv().compile(schema as any);
    expect(validate(data)).toBe(false);
    expect(
      (validate.errors ?? []).map((error) => [
        error.instancePath,
        error.keyword,
      ])
    ).toEqual([
      // One on the array, one on the item - which is the point of having both.
      ['/bonded', 'minItems'],
      ['/imported/1', 'enum'],
    ]);
  });

  /*
    The example's whole argument is that only the variant differs, so the two
    schemas really do have to be identical.
  */
  test('gives the checkbox group and the multi-select the same schema', () => {
    const properties = (schema as any).properties;
    expect(properties.channels.items).toEqual(properties.alerts.items);
    expect(properties.channels.uniqueItems).toBe(properties.alerts.uniqueItems);
    expect(optionsFor(uischema, 'channels').variant).toBeUndefined();
    expect(optionsFor(uischema, 'alerts').variant).toBe('multi-select');
  });

  test('carries a repeated token in an array that permits one', () => {
    expect((schema as any).properties.scans.uniqueItems).toBeUndefined();
    expect(data.scans).toEqual(['A-117', 'A-117', 'B-204']);
    expect(optionsFor(uischema, 'scans').variant).toBe('chips');
  });

  test('has both a free and a choice-limited chips field', () => {
    // Same variant; the schema is what decides whether entry is free.
    expect(optionsFor(uischema, 'tags').variant).toBe('chips');
    expect(optionsFor(uischema, 'labels').variant).toBe('chips');
    expect((schema as any).properties.tags.items.enum).toBeUndefined();
    expect((schema as any).properties.labels.items.enum).toHaveLength(3);
  });

  test('carries a value the schema does not offer', () => {
    expect(data.imported).toContain('Fax');
    expect((schema as any).properties.imported.items.enum).not.toContain(
      'Fax'
    );
  });

  test('bounds one field on both sides, for the restrict contract', () => {
    const bonded = (schema as any).properties.bonded;
    expect(bonded.minItems).toBe(2);
    expect(bonded.maxItems).toBe(3);
    expect(data.bonded.length).toBeLessThan(bonded.minItems);
  });

  test('ships both catalogs with matching keys', () => {
    expect(Object.keys(translations).sort()).toEqual(['bg', 'en']);
    expect(Object.keys(translations.bg).sort()).toEqual(
      Object.keys(translations.en).sort()
    );
  });
});

describe('the choice-controls example, extended for autocomplete', () => {
  test('asks for searchable choices, and shows the default beside them', () => {
    const controls = (choiceUischema as any).elements.filter(
      (e: any) => e.scope === '#/properties/origin'
    );
    // The same property twice: once searchable, once at the family default.
    expect(controls).toHaveLength(2);
    expect(controls.some((c: any) => c.options?.autocomplete === true)).toBe(
      true
    );
    expect(controls.some((c: any) => c.options === undefined)).toBe(true);
  });

  test('searches a oneOf whose labels differ from its stored constants', () => {
    const handler = (choiceSchema as any).properties.handler;
    expect(handler.oneOf.map((b: any) => b.const)).toEqual([
      'eng',
      'fin',
      'ops',
    ]);
    expect(handler.oneOf.map((b: any) => b.title)).toEqual([
      'Engineering',
      'Finance',
      'Operations',
    ]);
  });
});
