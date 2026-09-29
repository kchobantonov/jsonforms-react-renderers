import { describe, expect, test } from 'vitest';
import { createAjv } from '@jsonforms/core';
import examples, { isSpecExample } from '../src/examples';
import data from '@chobantonov/jsonforms-extended-spec/examples/additional-properties/data.json';
import schema from '@chobantonov/jsonforms-extended-spec/examples/additional-properties/schema.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/additional-properties/translations.json';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/additional-properties/uischema.json';

const example = examples.find((e) => e.name === 'spec-additional-properties');

const controls = (uischema as any).elements.filter(
  (element: any) => element.type === 'Control'
);
const optionsFor = (property: string) =>
  controls.find((c: any) => c.scope === `#/properties/${property}`)?.options ??
  {};

describe('the additional-properties spec example', () => {
  test('is registered into the demo list', () => {
    expect(example).toBeDefined();
    expect(example?.label).toBe('Spec: Additional properties');
    expect(isSpecExample(example!.name)).toBe(true);
  });

  test('produces exactly the two errors its README documents', () => {
    const ajv = createAjv();
    const validate = ajv.compile(schema as any);
    expect(validate(data)).toBe(false);
    // One violation - `sensor-x` is 8 characters where 9 are required - which
    // Ajv reports as the inner failure plus the wrapping keyword.
    expect(
      (validate.errors ?? []).map((error) => [
        error.instancePath,
        error.keyword,
      ])
    ).toEqual([
      ['/telemetry', 'minLength'],
      ['/telemetry', 'propertyNames'],
    ]);
  });

  test('holds the keys that only became possible with core 3.9', () => {
    const keys = Object.keys((data as any).labels);
    expect(keys).toContain('items[0]');
    expect(keys).toContain('2024');
  });

  test('holds a key that no data path can address, for the isolated editor', () => {
    expect(Object.keys((data as any).labels)).toContain('');
    expect(Object.keys((data as any).annotations)).toContain('legacy.key');
  });

  test('keeps a whitespace-padded key exactly as written', () => {
    expect(Object.keys((data as any).labels)).toContain('  spaced  ');
  });

  /*
    `__proto__` is deliberately *not* in the fixture. A quoted `__proto__` in a
    JSON file survives `JSON.parse`, but the bundler compiles a JSON module into
    an object literal - where `{"__proto__": v}` sets the prototype instead of
    creating a key, so the property silently disappears. The renderer's own
    `assignOwnProperty` test covers the case that actually matters: someone
    typing the name into the Add box.
  */
  test('does not try to author a __proto__ key, which a JSON module cannot carry', () => {
    expect(Object.keys((data as any).annotations)).not.toContain('__proto__');
    expect(Object.keys((data as any).annotations)).toContain('notes/1');
  });

  /*
    Section 18 requires an element option to override global config "including
    `false` overriding `true`", so the example has to contain that exact pair
    for the demo to demonstrate it.
  */
  test('sets the empty-name option at both levels, including a false over a true', () => {
    expect((example?.config as any).allowEmptyPropertyNames).toBe(true);
    expect(optionsFor('labels').allowEmptyPropertyNames).toBe(true);
    expect(optionsFor('quota').allowEmptyPropertyNames).toBe(false);
  });

  test('constrains one object by propertyNames beyond a pattern', () => {
    const telemetry = (schema as any).properties.telemetry;
    expect(telemetry.propertyNames.pattern).toBeDefined();
    // The keyword a pattern-only check would have ignored.
    expect(telemetry.propertyNames.minLength).toBe(9);
  });

  test('closes one object to everything its patterns do not claim', () => {
    const headers = (schema as any).properties.headers;
    expect(headers.additionalProperties).toBe(false);
    expect(Object.keys(headers.patternProperties)).toHaveLength(2);
  });

  test('ships both catalogs with matching keys', () => {
    expect(Object.keys(translations).sort()).toEqual(['bg', 'en']);
    expect(Object.keys(translations.bg).sort()).toEqual(
      Object.keys(translations.en).sort()
    );
  });

  test('translates every name-refusal message', () => {
    for (const locale of ['en', 'bg'] as const) {
      for (const key of [
        'additionalProperties.nameRequired',
        'additionalProperties.nameTaken',
        'additionalProperties.nameInvalid',
      ]) {
        expect((translations as any)[locale][key]).toBeTruthy();
      }
    }
  });
});
