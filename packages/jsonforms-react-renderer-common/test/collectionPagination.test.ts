import { describe, expect, it } from 'vitest';
import { resolvePagination } from '../src/collectionPagination';
describe('collection pagination defaults', () => {
  it('defaults to five items while preserving explicit page sizes', () => {
    expect(resolvePagination(undefined, {}, 'array', true).size).toBe(5);
    expect(
      resolvePagination(true, {}, 'additionalProperties', false).size
    ).toBe(5);
    expect(resolvePagination({ pageSize: 10 }, {}, 'array', true).size).toBe(
      10
    );
  });
  it('separates array and property defaults and honors false', () => {
    const config = {
      jsonformsExtended: {
        array: { pagination: { pageSize: 5 } },
        additionalProperties: { pagination: false },
      },
    };
    expect(resolvePagination(undefined, config, 'array', true)).toMatchObject({
      enabled: true,
      size: 5,
    });
    expect(
      resolvePagination(undefined, config, 'additionalProperties', false)
        .enabled
    ).toBe(false);
    expect(resolvePagination(false, config, 'array', true).enabled).toBe(false);
    expect(
      resolvePagination(
        undefined,
        { pagination: true },
        'additionalProperties',
        false
      ).enabled
    ).toBe(false);
  });
  it('enables additional sections by default and supports scoped boolean overrides', () => {
    for (const kind of ['additionalItems', 'additionalProperties'] as const) {
      expect(resolvePagination(undefined, {}, kind)).toMatchObject({
        enabled: true,
        size: 5,
      });
      const config = { jsonformsExtended: { [kind]: { pagination: false } } };
      expect(resolvePagination(undefined, config, kind).enabled).toBe(false);
      expect(resolvePagination(true, config, kind).enabled).toBe(true);
      expect(resolvePagination(false, {}, kind).enabled).toBe(false);
    }
  });
  it('includes the initial size and filters invalid choices without mutating options', () => {
    const options = { pageSize: 7, pageSizeOptions: [5, 5, 0, 10] };
    expect(resolvePagination(options, {}, 'array', true).choices).toEqual([
      5, 7, 10,
    ]);
    expect(options.pageSizeOptions).toEqual([5, 5, 0, 10]);
  });
});
