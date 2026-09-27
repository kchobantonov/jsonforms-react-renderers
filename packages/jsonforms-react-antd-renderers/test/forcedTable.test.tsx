import { arrayControlTester } from '../src/complex/ArrayControlRenderer';
import { arrayLayoutTester } from '../src/layouts/ArrayLayoutRenderer';

// Nested address/phoneNumbers => isObjectArrayWithNesting, which the detail
// renderer (rank 4) matches. Without an opt-in the table (rank 3) always loses.
const nestedSchema: any = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      firstName: { type: 'string' },
      address: { type: 'object', properties: { street: { type: 'string' } } },
      phoneNumbers: { type: 'array', items: { type: 'string' } },
    },
  },
};
const flatSchema: any = {
  type: 'array',
  items: { type: 'object', properties: { firstName: { type: 'string' } } },
};
const ctx: any = { rootSchema: nestedSchema, config: {} };
const control = (options?: Record<string, unknown>) =>
  ({ type: 'Control', scope: '#', options } as any);

describe('forced table tester', () => {
  it('loses to the detail renderer for nested items by default', () => {
    const table = arrayControlTester(control(), nestedSchema, ctx);
    const detail = arrayLayoutTester(control(), nestedSchema, ctx);
    expect(detail).toBeGreaterThan(table);
  });

  it.each([
    ['table: true', { table: true }],
    ["format: 'table'", { format: 'table' }],
  ])('wins with %s', (_label, options) => {
    const table = arrayControlTester(control(options), nestedSchema, ctx);
    const detail = arrayLayoutTester(control(options), nestedSchema, ctx);
    expect(table).toBeGreaterThan(detail);
  });

  it('still ranks flat arrays normally', () => {
    expect(arrayControlTester(control(), flatSchema, ctx)).toBe(3);
  });

  it('does not claim non-arrays', () => {
    const objectSchema: any = { type: 'object', properties: {} };
    expect(
      arrayControlTester(control({ table: true }), objectSchema, ctx)
    ).toBe(-1);
  });
});
