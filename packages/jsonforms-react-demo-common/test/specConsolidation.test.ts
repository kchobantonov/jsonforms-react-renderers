import { describe, expect, it } from 'vitest';
import { createFormsAjv } from '@chobantonov/jsonforms-react-extended-renderers';
import examples, { isSpecExample, translatorFor } from '../src/examples';

const ajv = createFormsAjv({ allErrors: true });
const find = (id: string) => {
  const example = examples.find((entry) => entry.name === `spec-${id}`);
  expect(example).toBeDefined();
  return example!;
};

describe('consolidated spec fixtures', () => {
  it.each(['file-control', 'code-editor'])(
    '%s registers valid initial data and matching catalogs',
    (id) => {
      const example = find(id);
      expect(isSpecExample(example.name)).toBe(true);
      const validate = ajv.compile(example.schema!);
      expect(validate(example.data), JSON.stringify(validate.errors)).toBe(
        true
      );
      const catalogs = (example as any).translations;
      expect(Object.keys(catalogs.en).sort()).toEqual(
        Object.keys(catalogs.bg).sort()
      );
      expect(translatorFor(catalogs, 'bg')('intro.text')).toBeTruthy();
    }
  );

  it('validates staff independently of the deliberate array errors', () => {
    const example = find('array-controls');
    const validate = ajv.compile((example.schema as any).properties.staff);
    expect(
      validate((example.data as any).staff),
      JSON.stringify(validate.errors)
    ).toBe(true);
    const invalidStaff = JSON.parse(
      JSON.stringify((example.data as any).staff)
    );
    invalidStaff[0].age = -1;
    expect(validate(invalidStaff)).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ instancePath: '/0/age', keyword: 'minimum' }),
      ])
    );
  });

  it('keeps JSON conversion validation separate from text syntax', () => {
    const example = find('code-editor');
    const validate = ajv.compile(example.schema!);
    expect(
      validate({
        ...(example.data as object),
        document: { service: 'catalog', replicas: 0 },
      })
    ).toBe(false);
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: '/document/replicas',
          keyword: 'minimum',
        }),
      ])
    );
    expect(
      validate({
        ...(example.data as object),
        script: 'not valid JavaScript {',
      })
    ).toBe(true);
  });

  it('accepts the week-based duration without adding a format error', () => {
    const example = find('temporal-controls');
    const validate = ajv.compile(
      (example.schema as any).properties.schemaBased
    );
    expect(
      validate((example.data as any).schemaBased),
      JSON.stringify(validate.errors)
    ).toBe(true);
  });
});
