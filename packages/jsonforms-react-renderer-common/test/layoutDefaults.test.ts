import { containerStyle, resolveGap } from '../src/layoutSizing';

describe('portable layout defaults', () => {
  it('uses the portable 16px gap without requiring inserted schema defaults', () => {
    expect(resolveGap(undefined, undefined, 'row')).toBe(16);
    expect(resolveGap(undefined, undefined, 'column')).toBe(16);
  });

  it('accepts the consuming library spacing in both directions', () => {
    const defaults = { row: 16, column: '1rem' };
    expect(resolveGap(undefined, undefined, 'row', defaults)).toBe(16);
    expect(containerStyle(undefined, undefined, 'column', defaults).gap).toBe(
      '1rem'
    );
  });

  it('keeps element and namespaced settings ahead of family defaults', () => {
    const config = { jsonformsExtended: { layoutDefaults: { gap: 8 } } };
    const defaults = { row: 16, column: 12 };
    expect(resolveGap({ gap: 0 }, config, 'row', defaults)).toBe(0);
    expect(resolveGap(undefined, config, 'row', defaults)).toBe(8);
  });
});
