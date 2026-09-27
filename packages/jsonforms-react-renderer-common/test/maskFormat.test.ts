import { Mask } from 'maska';
import {
  DEFAULT_MASK_TOKENS,
  MASKA_DEFAULT_TOKENS,
  codePointLength,
  compileTokenPattern,
  createMask,
  displayValue,
  fitsMask,
  isMaskPattern,
  maskEdit,
  nextCaret,
  resolveMaskSettings,
  storedValue,
  toMaskTokens,
  withinMaxLength,
} from '../src/maskFormat';

const maskFor = (options: Record<string, unknown>): Mask =>
  createMask(resolveMaskSettings(options, undefined)!);

describe('the default token grammar', () => {
  it('is the table the specification states', () => {
    expect(Object.keys(DEFAULT_MASK_TOKENS).sort()).toEqual(['#', '*', '@']);
    expect('7').toMatch(DEFAULT_MASK_TOKENS['#'].pattern);
    expect('a').not.toMatch(DEFAULT_MASK_TOKENS['#'].pattern);
    expect('Q').toMatch(DEFAULT_MASK_TOKENS['@'].pattern);
    expect('7').not.toMatch(DEFAULT_MASK_TOKENS['@'].pattern);
    expect('7').toMatch(DEFAULT_MASK_TOKENS['*'].pattern);
    expect('Q').toMatch(DEFAULT_MASK_TOKENS['*'].pattern);
    expect('-').not.toMatch(DEFAULT_MASK_TOKENS['*'].pattern);
  });

  it('still equals the engine own, so a bump cannot reinterpret authored masks', () => {
    const sources = (tokens: typeof DEFAULT_MASK_TOKENS) =>
      Object.fromEntries(
        Object.entries(tokens).map(([key, token]) => [
          key,
          token.pattern.source,
        ])
      );
    expect(sources(DEFAULT_MASK_TOKENS)).toEqual(sources(MASKA_DEFAULT_TOKENS));
  });
});

describe('selecting on a mask pattern', () => {
  it('accepts a pattern and a set of alternatives', () => {
    expect(isMaskPattern('###-###')).toBe(true);
    expect(isMaskPattern(['#### ####', '#### #### ####'])).toBe(true);
  });

  /*
    The defect recorded against the Svelte families: they select with
    `hasOption('mask')`, so a *temporal* control turning its own mask off with
    `"mask": false` became eligible for the generic masked renderer.
  */
  it('rejects the boolean temporal opt-out and everything else that is not a pattern', () => {
    expect(isMaskPattern(false)).toBe(false);
    expect(isMaskPattern(true)).toBe(false);
    expect(isMaskPattern('')).toBe(false);
    expect(isMaskPattern([])).toBe(false);
    expect(isMaskPattern(['###', ''])).toBe(false);
    expect(isMaskPattern(undefined)).toBe(false);
    expect(isMaskPattern(42)).toBe(false);
    // A function mask is a maska feature, but a UI schema is JSON and the
    // specification rules function-valued options out of the portable model.
    expect(isMaskPattern(() => '###')).toBe(false);
  });

  it('resolves no settings at all without a pattern', () => {
    expect(resolveMaskSettings({ mask: false }, undefined)).toBeUndefined();
    expect(resolveMaskSettings({}, undefined)).toBeUndefined();
  });
});

describe('resolving options', () => {
  it('reads every boolean as written', () => {
    const omitted = resolveMaskSettings({ mask: '###' }, undefined)!;
    expect(omitted.eager).toBe(false);
    expect(omitted.reversed).toBe(false);
    expect(omitted.returnMaskedValue).toBe(false);
    expect(omitted.tokensReplace).toBe(true);

    // The inversion the Svelte gap review records would make these false.
    const on = resolveMaskSettings(
      { mask: '###', eager: true, reversed: true, returnMaskedValue: true },
      undefined
    )!;
    expect(on.eager).toBe(true);
    expect(on.reversed).toBe(true);
    expect(on.returnMaskedValue).toBe(true);

    const off = resolveMaskSettings(
      { mask: '###', eager: false, reversed: false, tokensReplace: false },
      undefined
    )!;
    expect(off.eager).toBe(false);
    expect(off.reversed).toBe(false);
    expect(off.tokensReplace).toBe(false);
  });

  it('takes family conventions from top-level config, and the element wins', () => {
    const fromConfig = resolveMaskSettings(
      { mask: '###-###' },
      { returnMaskedValue: true }
    )!;
    expect(fromConfig.returnMaskedValue).toBe(true);

    const overridden = resolveMaskSettings(
      { mask: '###-###', returnMaskedValue: false },
      { returnMaskedValue: true }
    )!;
    expect(overridden.returnMaskedValue).toBe(false);
  });

  it('never takes the mask itself from config', () => {
    expect(resolveMaskSettings({}, { mask: '###-###' })).toBeUndefined();
  });

  it('prefers tokens over maskReplacers rather than merging them', () => {
    const settings = resolveMaskSettings(
      {
        mask: '##',
        tokens: { '#': '[0-1]' },
        maskReplacers: { '#': '[7-9]' },
      },
      undefined
    )!;
    expect('1').toMatch(settings.tokens['#'].pattern);
    expect('8').not.toMatch(settings.tokens['#'].pattern);
  });

  it('accepts maskReplacers on its own, for documents written before tokens', () => {
    const settings = resolveMaskSettings(
      { mask: '##', maskReplacers: { '#': '[7-9]' } },
      undefined
    )!;
    expect('8').toMatch(settings.tokens['#'].pattern);
  });
});

describe('building the token table', () => {
  it('adds to the defaults rather than replacing them', () => {
    const tokens = toMaskTokens({ H: '[0-2]' })!;
    expect(Object.keys(tokens).sort()).toEqual(['#', '*', '@', 'H']);
    expect('2').toMatch(tokens.H.pattern);
  });

  it('removes a default token when the entry is falsy', () => {
    expect(Object.keys(toMaskTokens({ '@': false })!).sort()).toEqual([
      '#',
      '*',
    ]);
    expect(Object.keys(toMaskTokens({ '@': null })!).sort()).toEqual([
      '#',
      '*',
    ]);
  });

  it('keeps the repetition flags and drops everything else', () => {
    const tokens = toMaskTokens({
      D: { pattern: '[0-9]', repeated: true, optional: true, multiple: true },
      // A function cannot survive a JSON UI schema, so it must not survive here.
      T: { pattern: '[0-9]', transform: (c: string) => c } as never,
    })!;
    expect(tokens.D.repeated).toBe(true);
    expect(tokens.D.optional).toBe(true);
    expect(tokens.D.multiple).toBe(true);
    expect(tokens.T.pattern.source).toBe('[0-9]');
    expect(
      (tokens.T as unknown as Record<string, unknown>).transform
    ).toBeUndefined();
  });

  it('drops a token whose pattern does not compile, and says which', () => {
    const invalid: string[] = [];
    const tokens = toMaskTokens({ B: '[unclosed' }, (token) =>
      invalid.push(token)
    )!;
    expect(invalid).toEqual(['B']);
    expect(tokens.B).toBeUndefined();
    // and the defaults survive, so the rest of the mask still works
    expect(Object.keys(tokens).sort()).toEqual(['#', '*', '@']);
  });

  it('compiles a pattern that only the unflagged mode accepts', () => {
    // `\-` is a valid escape in an ordinary regex and a SyntaxError under `u`.
    expect(compileTokenPattern('[a\\-z]')).toBeInstanceOf(RegExp);
    expect(compileTokenPattern('\\p{L}')).toBeInstanceOf(RegExp);
    expect(compileTokenPattern('[unclosed')).toBeUndefined();
  });

  it('ignores a token map that is not an object', () => {
    expect(toMaskTokens(undefined)).toBeUndefined();
    expect(toMaskTokens('###')).toBeUndefined();
    expect(toMaskTokens(['#'])).toBeUndefined();
  });
});

describe('what is displayed and what is stored', () => {
  const mask = maskFor({ mask: '###-###' });

  it('stores the characters typed, without the mask literals, by default', () => {
    expect(storedValue(mask, '123-456', false)).toBe('123456');
    expect(storedValue(mask, '123-4', false)).toBe('1234');
  });

  it('stores the literals too when the author asks for it', () => {
    expect(storedValue(mask, '123-456', true)).toBe('123-456');
  });

  it('displays a stored value through the mask', () => {
    expect(displayValue(mask, '123456', false)).toBe('123-456');
    expect(displayValue(mask, '1234', false)).toBe('123-4');
    expect(displayValue(mask, '', false)).toBe('');
  });

  it('treats a partial value as fitting, because a mask does not prove completeness', () => {
    expect(fitsMask(mask, '1', false)).toBe(true);
    expect(fitsMask(mask, '123', false)).toBe(true);
  });

  /*
    Section 19, and the shared editing contract: "preserve invalid incoming data
    for correction; do not truncate it automatically on rendering."
  */
  it('shows a value the mask cannot carry verbatim instead of truncating it', () => {
    expect(fitsMask(mask, '1234567890', false)).toBe(false);
    expect(displayValue(mask, '1234567890', false)).toBe('1234567890');

    expect(fitsMask(mask, 'unknown', false)).toBe(false);
    expect(displayValue(mask, 'unknown', false)).toBe('unknown');
  });

  it('judges fit against the stored representation the author chose', () => {
    // `123-456` is what a returnMaskedValue field stores and an unmasked one
    // does not, so the same string fits under one setting and not the other.
    expect(fitsMask(mask, '123-456', true)).toBe(true);
    expect(fitsMask(mask, '123456', true)).toBe(false);
    expect(displayValue(mask, '123456', true)).toBe('123456');
  });

  it('fills literals ahead of the caret only when eager', () => {
    expect(displayValue(maskFor({ mask: '###-###' }), '123', false)).toBe(
      '123'
    );
    expect(
      displayValue(maskFor({ mask: '###-###', eager: true }), '123', false)
    ).toBe('123-');
  });

  it('honours reversed, custom tokens and alternative masks', () => {
    expect(
      displayValue(maskFor({ mask: '#,##', reversed: true }), '123', false)
    ).toBe('1,23');
    expect(
      displayValue(
        maskFor({ mask: 'HH:MM', tokens: { H: '[0-2]', M: '[0-5]' } }),
        '1234',
        false
      )
    ).toBe('12:34');
    expect(
      displayValue(
        maskFor({ mask: ['#### ####', '#### #### ####'] }),
        '123456789012',
        false
      )
    ).toBe('1234 5678 9012');
  });
});

describe('length limits', () => {
  it('counts code points, not UTF-16 units', () => {
    // The specification's own example: one code point, two units, and a
    // `maxLength: 1` schema accepts it.
    expect('😀'.length).toBe(2);
    expect(codePointLength('😀')).toBe(1);
    expect(withinMaxLength('😀', 1)).toBe(true);
  });

  it('measures the stored string, which is shorter than the display', () => {
    const mask = maskFor({ mask: '###-###' });
    // Seven characters on screen, six stored. A DOM `maxlength` of 6 would
    // block the sixth digit; the limit belongs on what is stored.
    expect(displayValue(mask, '123456', false)).toHaveLength(7);
    expect(withinMaxLength(storedValue(mask, '123-456', false), 6)).toBe(true);
  });

  it('has no limit when the schema sets none', () => {
    expect(withinMaxLength('anything at all', undefined)).toBe(true);
  });
});

describe('where the caret lands', () => {
  const mask = maskFor({ mask: '###-###' });

  it('is left alone while typing at the end', () => {
    expect(nextCaret(mask, '1234', 4, '123-4', false)).toBeUndefined();
    expect(nextCaret(mask, '1234', null, '123-4', false)).toBeUndefined();
  });

  it('steps over a literal the mask inserted behind the caret', () => {
    // `1235|56` typed into `123-56`: the caret sat after the 4th character, and
    // the mask pushed everything right of the separator along by one.
    expect(nextCaret(mask, '123556', 4, '123-556', false)).toBe(5);
  });

  it('stays put when the mask changed nothing before it', () => {
    expect(nextCaret(mask, '123-456', 2, '123-456', false)).toBe(2);
  });

  it('follows the text back when characters were deleted', () => {
    expect(nextCaret(mask, '12-456', 2, '124-56', true)).toBe(2);
  });

  it('goes to the start when nothing typable precedes it', () => {
    expect(nextCaret(mask, '-123456', 1, '123-456', false)).toBe(0);
  });

  it('clears an eager mask completely when its last character is deleted', () => {
    const eager = maskFor({ mask: '###-###', eager: true });
    // Without this the literals would be left stranded and unremovable.
    expect(maskEdit(eager, '', true)).toBe('');
    expect(maskEdit(eager, '123', false)).toBe('123-');
  });
});
