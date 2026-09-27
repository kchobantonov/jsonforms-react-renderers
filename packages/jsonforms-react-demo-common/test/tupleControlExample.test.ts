import { describe, expect, test } from 'vitest';
import { createAjv } from '@jsonforms/core';
import examples, { isSpecExample } from '../src/examples';
import data from '../src/examples/spec/tuple-control/data.json';
import schema from '../src/examples/spec/tuple-control/schema.json';
import translations from '../src/examples/spec/tuple-control/translations.json';
import uischema from '../src/examples/spec/tuple-control/uischema.json';
import { uischemas } from '../src/examples/spec/tuple-control/uischemas';

const example = examples.find((e) => e.name === 'spec-tuple-control');

const controls = (uischema as any).elements.filter(
  (element: any) => element.type === 'Control'
);
const optionsFor = (property: string) =>
  controls.find((c: any) => c.scope === `#/properties/${property}`)?.options ??
  {};

describe('the tuple-control spec example', () => {
  test('is registered into the demo list', () => {
    expect(example).toBeDefined();
    expect(example?.label).toBe('Spec: Tuple control');
    expect(isSpecExample(example!.name)).toBe(true);
  });

  /*
    One of each placement section 18 distinguishes: an error on a position, and
    an error on the array as a whole. The README explains both, so they are
    pinned here rather than only verified once at the time of writing.
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
      ['/dimensions/2', 'minimum'],
      ['/legacyAssignment', 'additionalItems'],
    ]);
  });

  test('keeps an empty tuple, so the missing-position case is reachable', () => {
    expect(data.orderLine).toEqual([]);
    expect((schema as any).properties.orderLine.items).toHaveLength(2);
  });

  test('keeps a trailing value its schema forbids, rather than trimming it', () => {
    expect(data.legacyAssignment).toHaveLength(3);
    expect((schema as any).properties.legacyAssignment.additionalItems).toBe(false);
  });

  test('asks for a tuple it cannot have, to reach the diagnostic', () => {
    expect(optionsFor('misconfigured').variant).toBe('tuple');
    const misconfigured = (schema as any).properties.misconfigured;
    expect(Array.isArray(misconfigured.items)).toBe(false);
    expect(misconfigured.minItems).toBeUndefined();
  });

  /*
    Core's path-derived i18n prefix strips array indices, so two positions of
    one tuple would otherwise resolve to the same key. The explicit schema
    `i18n` is what makes distinct labels possible, and every key it names must
    exist in both catalogs.
  */
  test('gives each coordinate position its own translation prefix', () => {
    const positions = (schema as any).properties.coordinates.items;
    expect(positions.map((p: any) => p.i18n)).toEqual([
      'coordinates.x',
      'coordinates.y',
    ]);
    for (const locale of ['en', 'bg'] as const) {
      for (const prefix of ['coordinates.x', 'coordinates.y']) {
        expect((translations as any)[locale][`${prefix}.label`]).toBeTruthy();
      }
    }
  });

  test('leaves the uniform tuple sharing one schema, so it uses position labels', () => {
    const dimensions = (schema as any).properties.dimensions;
    expect(Array.isArray(dimensions.items)).toBe(false);
    expect(dimensions.minItems).toBe(dimensions.maxItems);
    expect(optionsFor('dimensions').variant).toBe('tuple');
    // The parameterized fallback, not a number glued onto a translated word.
    expect(translations.en['tuple.position']).toContain('{position}');
    expect(translations.bg['tuple.position']).toContain('{position}');
  });

  test('registers an entry for each complex position of pickupContact', () => {
    const positions = (schema as any).properties.pickupContact.items;
    const forPosition = (position: any) =>
      uischemas.filter(
        (entry) => entry.tester(position, position, {} as any) === 10
      );

    for (const position of positions) {
      const matched = forPosition(position);
      // Exactly one entry claims each, and it describes both halves.
      expect(matched).toHaveLength(1);
      const options = (matched[0].uischema as any).options;
      expect(options.summary).toBeDefined();
      expect(options.detail).toBeDefined();
    }

    // They do not claim each other's position.
    expect(forPosition(positions[0])[0]).not.toBe(forPosition(positions[1])[0]);
  });

  /*
    `handoffContacts` exists to carry one position per *shape* a registry entry
    can take, so these deliberately differ from each other - which is why the
    test above is scoped to `pickupContact` rather than asserting over the
    whole registry.
  */
  test('registers one entry per registry-entry shape for handoffContacts', () => {
    const entryFor = (title: string) =>
      uischemas.find(
        (entry) =>
          entry.tester({ title } as any, { title } as any, {} as any) === 10
      );

    const both = entryFor('Both')!.uischema as any;
    expect(both.type).toBe('Control');
    expect(both.options.summary).toBeDefined();
    expect(both.options.detail).toBeDefined();

    const detailOnly = entryFor('DetailOnly')!.uischema as any;
    expect(detailOnly.type).toBe('Control');
    expect(detailOnly.options.summary).toBeUndefined();
    expect(detailOnly.options.detail).toBeDefined();

    // "A registry entry that is already a layout remains usable directly as
    // the dialog detail" - so no wrapping Control and no `detail` key.
    const layout = entryFor('LayoutEntry')!.uischema as any;
    expect(layout.type).toBe('HorizontalLayout');
    expect(layout.options).toBeUndefined();

    // The fourth shape is the absence of an entry.
    expect(entryFor('NoEntry')).toBeUndefined();
  });

  /*
    A Control entry with `summary` and no `detail` hangs when its dialog opens
    (Adjustment 20.7). Until that is fixed the fixture must not contain one -
    the demo would freeze rather than merely look wrong.
  */
  test('ships no summary-only Control entry', () => {
    for (const entry of uischemas) {
      const uischema = entry.uischema as any;
      if (uischema.type !== 'Control') continue;
      const options = uischema.options ?? {};
      expect(
        options.summary !== undefined && options.detail === undefined,
        'a summary-only Control entry hangs the dialog; see Adjustment 20.7'
      ).toBe(false);
    }
  });

  test('ships both catalogs with matching keys', () => {
    expect(Object.keys(translations).sort()).toEqual(['bg', 'en']);
    expect(Object.keys(translations.bg).sort()).toEqual(
      Object.keys(translations.en).sort()
    );
  });
});
