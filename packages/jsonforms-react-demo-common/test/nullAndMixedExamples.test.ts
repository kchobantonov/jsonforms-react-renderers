import { describe, expect, test } from 'vitest';
import { createAjv } from '@jsonforms/core';
import examples, { isSpecExample } from '../src/examples';
import nullData from '../src/examples/spec/null-control/data.json';
import nullSchema from '../src/examples/spec/null-control/schema.json';
import nullTranslations from '../src/examples/spec/null-control/translations.json';
import mixedData from '../src/examples/spec/mixed-control/data.json';
import mixedSchema from '../src/examples/spec/mixed-control/schema.json';
import mixedTranslations from '../src/examples/spec/mixed-control/translations.json';

const errorsFor = (schema: any, data: any) => {
  const validate = createAjv().compile(schema);
  validate(data);
  return (validate.errors ?? []).map((error) => [
    error.instancePath,
    error.keyword,
  ]);
};

describe('the null-control spec example', () => {
  const example = examples.find((e) => e.name === 'spec-null-control');

  test('is registered into the demo list', () => {
    expect(example).toBeDefined();
    expect(example?.label).toBe('Spec: Null control');
    expect(isSpecExample(example!.name)).toBe(true);
  });

  test('produces exactly the two errors its README documents', () => {
    expect(errorsFor(nullSchema, nullData)).toEqual([
      // Attached to the object: an absent property has no path of its own.
      ['', 'required'],
      ['/legacyApproval', 'type'],
    ]);
  });

  /*
    The example exists to separate three states that are easy to conflate, so
    each has to actually be in the fixture.
  */
  test('carries all three states of a null property', () => {
    const data = nullData as Record<string, unknown>;
    expect(data.noSurcharge).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(data, 'exceptionsChecked')).toBe(
      false
    );
    expect(data.legacyApproval).toBe('n/a');
  });

  test('contrasts null with an empty string and with absence', () => {
    const data = nullData as Record<string, unknown>;
    expect(data.reviewNote).toBe('');
    expect(Object.prototype.hasOwnProperty.call(data, 'referenceNumber')).toBe(
      false
    );
  });

  test('includes a union with null, which is the mixed control instead', () => {
    expect((nullSchema as any).properties.inspectionRemark.type).toEqual([
      'string',
      'null',
    ]);
    expect((nullSchema as any).properties.noSurcharge.type).toBe('null');
  });

  test('ships both catalogs with matching keys', () => {
    expect(Object.keys(nullTranslations).sort()).toEqual(['bg', 'en']);
    expect(Object.keys(nullTranslations.bg).sort()).toEqual(
      Object.keys(nullTranslations.en).sort()
    );
  });
});

describe('the mixed-control spec example', () => {
  const example = examples.find((e) => e.name === 'spec-mixed-control');

  test('is registered into the demo list', () => {
    expect(example).toBeDefined();
    expect(example?.label).toBe('Spec: Mixed control');
    expect(isSpecExample(example!.name)).toBe(true);
  });

  test('produces exactly the one error its README documents', () => {
    expect(errorsFor(mixedSchema, mixedData)).toEqual([['/priority', 'type']]);
  });

  test('distinguishes an explicit null from an absent value', () => {
    const data = mixedData as Record<string, unknown>;
    expect(data.surcharge).toBeNull();
    expect(Object.prototype.hasOwnProperty.call(data, 'reference')).toBe(false);
  });

  test('holds an integer where the schema says number', () => {
    // Section 18: "an integer is also admissible under number."
    expect(mixedData.quantity).toBe(42);
    expect((mixedSchema as any).properties.quantity.type).not.toContain(
      'integer'
    );
  });

  test('holds a value none of the permitted types admit', () => {
    expect(mixedData.priority).toBe(true);
    expect((mixedSchema as any).properties.priority.type).toEqual([
      'string',
      'number',
    ]);
  });

  test('includes an unconstrained schema, which this renderer also takes', () => {
    const anything = (mixedSchema as any).properties.anything;
    expect(anything.type).toBeUndefined();
  });

  test('includes an array whose elements are mixed, for the clear-type rule', () => {
    // A tuple with an open tail: the trailing values have no schema of their
    // own, so they are edited by the mixed control at an array index.
    const assignment = (mixedSchema as any).properties.assignment;
    expect(Array.isArray(assignment.items)).toBe(true);
    expect(assignment.additionalItems).toBe(true);
    expect(mixedData.assignment.length).toBeGreaterThan(assignment.items.length);
  });

  test('ships both catalogs with matching keys', () => {
    expect(Object.keys(mixedTranslations).sort()).toEqual(['bg', 'en']);
    expect(Object.keys(mixedTranslations.bg).sort()).toEqual(
      Object.keys(mixedTranslations.en).sort()
    );
  });
});
