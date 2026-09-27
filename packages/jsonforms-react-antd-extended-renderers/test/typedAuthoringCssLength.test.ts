import { describe, expect, it } from 'vitest';
import {
  forSchema,
  type AuthoredSchema,
  type CssLength,
} from '@chobantonov/jsonforms-react-extended-renderers';

/*
  The sizing options are the one place in this module where the type is
  *narrower* than the runtime: `toCss` passes any string through, so this type
  can only ever be a subset of what works. That makes a false rejection worse
  than a missed mistake - it turns correct CSS into a build failure - so what
  it accepts is pinned here rather than left to whoever edits the unit list.
*/

const schema = {
  type: 'object',
  properties: { note: { type: 'string' } },
} as const satisfies AuthoredSchema;

const f = forSchema(schema);

describe('what a sizing option accepts', () => {
  it('takes the values this repository already authors', () => {
    // Straight from the spec examples' uischemas.
    const used: CssLength[] = [180, 120, 64, '1rem', '0.5rem', '1.5rem', '14rem', '10rem'];
    expect(used).toHaveLength(8);
  });

  it('takes the responsive notations, not only calc()', () => {
    const responsive: CssLength[] = [
      'calc(100% - 16px)',
      'clamp(1rem, 2vw, 3rem)',
      'min(100px, 50%)',
      'max(20ch, 30%)',
      'var(--field-width)',
      'fit-content(20rem)',
    ];
    expect(responsive).toHaveLength(6);
  });

  it('takes units a short list would have broken', () => {
    const units: CssLength[] = ['2vmin', '50dvh', '10pt', '3lh', '20ch', '0'];
    expect(units).toHaveLength(6);
  });

  it('takes the sizing keywords', () => {
    const keywords: CssLength[] = ['auto', 'none', 'min-content', 'fit-content', 'stretch'];
    expect(keywords).toHaveLength(5);
  });

  it('rejects what is actually a mistake', () => {
    // @ts-expect-error a number in a string, with no unit
    const noUnit: CssLength = '100';
    // @ts-expect-error not a length at all
    const nonsense: CssLength = 'pixels';
    // @ts-expect-error `fr` is a grid unit; these layouts are flex, so it
    // would be accepted by the type and ignored by the browser
    const gridUnit: CssLength = '1fr';
    expect([noUnit, nonsense, gridUnit]).toHaveLength(3);
  });
});

describe('the option names are the ones the renderer reads', () => {
  it('accepts minWidth and friends', () => {
    const control = f.control('note', {
      options: {
        layout: { span: 4, minWidth: '20ch', maxWidth: '40rem', height: 'auto' },
      },
    });
    expect(control.options?.layout?.minWidth).toBe('20ch');
  });

  it('rejects the short forms, which nothing reads', () => {
    f.control('note', {
      // @ts-expect-error `itemSizing` reads `minWidth`, never `min`
      options: { layout: { min: 10 } },
    });
    expect(true).toBe(true);
  });
});
