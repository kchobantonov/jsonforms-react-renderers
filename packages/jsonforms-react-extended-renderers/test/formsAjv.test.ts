import { describe, expect, it } from 'vitest';
import { createAjv } from '@jsonforms/core';
import { createFormsAjv } from '../src/core/ajv';

/*
  The validator these renderers are written against.

  Each option below is here because a schema in this repository needs it, and
  the first one is not a convenience: without `$data`, a schema using it does
  not merely go unenforced, it **fails to compile** and the form stops.
*/

const dateRange = {
  type: 'object',
  properties: {
    from: { type: 'string', format: 'date' },
    to: {
      type: 'string',
      format: 'date',
      formatMinimum: { $data: '1/from' },
    },
  },
} as any;

describe('$data bounds', () => {
  /* The failure this factory exists to prevent. */
  it('cannot be compiled by the plain JSON Forms validator', () => {
    expect(() => createAjv().compile(dateRange)).toThrowError(/formatMinimum/);
  });

  it('compiles here', () => {
    expect(() => createFormsAjv().compile(dateRange)).not.toThrow();
  });

  it('enforces one end of a range against the other', () => {
    const validate = createFormsAjv().compile(dateRange);
    expect(validate({ from: '2026-10-01', to: '2026-10-05' })).toBe(true);
    expect(validate({ from: '2026-10-05', to: '2026-10-01' })).toBe(false);
    expect(validate.errors?.[0].keyword).toBe('formatMinimum');
  });

  /* A half-filled range is not yet wrong. */
  it('says nothing while the other end is missing', () => {
    const validate = createFormsAjv().compile(dateRange);
    expect(validate({ to: '2026-10-01' })).toBe(true);
  });
});

describe('the other two options', () => {
  it('writes schema defaults into the data', () => {
    const validate = createFormsAjv().compile({
      type: 'object',
      properties: { tier: { type: 'string', default: 'standard' } },
    } as any);
    const data: any = {};
    validate(data);
    expect(data.tier).toBe('standard');
  });

  it('accepts a discriminated oneOf', () => {
    const validate = createFormsAjv().compile({
      type: 'object',
      discriminator: { propertyName: 'kind' },
      required: ['kind'],
      oneOf: [
        {
          properties: { kind: { const: 'email' }, email: { type: 'string' } },
          required: ['kind'],
        },
        {
          properties: { kind: { const: 'phone' }, phone: { type: 'string' } },
          required: ['kind'],
        },
      ],
    } as any);
    expect(validate({ kind: 'phone', phone: '555-0100' })).toBe(true);
  });
});

describe('formats', () => {
  /* `color` is not a JSON Schema format, and `ajv-formats` defines none. */
  it('registers color', () => {
    const validate = createFormsAjv().compile({
      type: 'string',
      format: 'color',
    } as any);
    expect(validate('#e55')).toBe(true);
    expect(validate('rgb(1, 2, 3)')).toBe(true);
    expect(validate('not a colour')).toBe(false);
  });

  it('takes extra formats from the caller', () => {
    const validate = createFormsAjv({
      formats: { even: (value: string) => Number(value) % 2 === 0 },
    }).compile({ type: 'string', format: 'even' } as any);
    expect(validate('4')).toBe(true);
    expect(validate('5')).toBe(false);
  });

  /* The temporal work depends on full-mode format validation staying on. */
  it('still validates time in full mode', () => {
    const validate = createFormsAjv().compile({
      type: 'string',
      format: 'time',
    } as any);
    expect(validate('09:30:00Z')).toBe(true);
    expect(validate('09:30:00')).toBe(false);
  });

  it('lets the caller override an option', () => {
    const validate = createFormsAjv({ useDefaults: false }).compile({
      type: 'object',
      properties: { tier: { type: 'string', default: 'standard' } },
    } as any);
    const data: any = {};
    validate(data);
    expect(data.tier).toBeUndefined();
  });
});
