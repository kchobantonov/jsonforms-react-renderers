import {
  COLOR_SAVE_FORMATS,
  asColorSaveFormat,
  isColor,
  normalizeHue,
  parseColor,
  pickerFormatFor,
  serializeColor,
  toCssColor,
} from '../src/util/colorFormat';

const parse = (text: string) => parseColor(text)!;

describe('color input profile', () => {
  it('accepts the three hexadecimal forms in either letter case', () => {
    expect(parse('#0f0')).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(parse('#00FF00')).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(parse('#00ff0080').a).toBeCloseTo(0.502, 3);
  });

  it('rejects four-digit hex, which is outside the specified profile', () => {
    // Accepting it would mean emitting representations the registered `color`
    // format validator is not required to accept.
    expect(parseColor('#0f08')).toBeUndefined();
  });

  it('accepts rgb, hsl and hsb functional notation, with and without alpha', () => {
    expect(parse('rgb(0, 255, 0)')).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(parse('rgba(0,255,0,0.5)')).toEqual({ r: 0, g: 255, b: 0, a: 0.5 });
    expect(parse('hsl(120, 100%, 50%)')).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(parse('hsb(120, 100%, 100%)')).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(parse('hsba(120, 100%, 100%, 0.25)').a).toBe(0.25);
  });

  it('treats rgb/rgba and hsl/hsla as synonyms, as CSS Color 4 does', () => {
    expect(parse('rgb(0, 255, 0, 0.5)').a).toBe(0.5);
    expect(parse('rgba(0, 255, 0)').a).toBe(1);
  });

  it('allows a missing percent sign on saturation and lightness', () => {
    expect(parse('hsl(120, 100, 50)')).toEqual(parse('hsl(120, 100%, 50%)'));
  });

  it('rejects rgb channels that are not integers in 0..255', () => {
    expect(parseColor('rgb(0, 300, 0)')).toBeUndefined();
    expect(parseColor('rgb(0, 25.5, 0)')).toBeUndefined();
    expect(parseColor('rgb(50%, 0%, 0%)')).toBeUndefined();
    expect(parseColor('rgb(-1, 0, 0)')).toBeUndefined();
  });

  it('rejects alpha outside 0..1 and malformed argument lists', () => {
    expect(parseColor('rgba(0, 0, 0, 2)')).toBeUndefined();
    expect(parseColor('rgb(0, 0)')).toBeUndefined();
    expect(parseColor('rgb(0, 0, 0, 0, 0)')).toBeUndefined();
    expect(parseColor('rgb(0 255 0)')).toBeUndefined();
  });

  it('rejects everything outside the profile instead of falling back to black', () => {
    // The picker's own color object answers `#000000` here. Section 18
    // requires an unsupported value to stay visible with errors rather than be
    // replaced by that fallback, which a parser that cannot fail cannot do.
    for (const text of [
      '',
      'rebeccapurple',
      'red',
      'not a color',
      '#12',
      'color(srgb 1 0 0)',
    ]) {
      expect(isColor(text)).toBe(false);
    }
    expect(isColor(null)).toBe(false);
    expect(isColor(0x00ff00)).toBe(false);
  });
});

describe('color serialization', () => {
  const green = parse('#00ff00');
  const half = parse('#00ff0080');

  it('writes every supported save format in the specified shape', () => {
    expect(serializeColor(green, 'hex')).toBe('#00ff00');
    expect(serializeColor(green, 'hex3')).toBe('#0f0');
    expect(serializeColor(green, 'rgb')).toBe('rgb(0, 255, 0)');
    expect(serializeColor(green, 'hsb')).toBe('hsb(120, 100%, 100%)');
  });

  it('offers only formats the picker can edit', () => {
    // HSL is parsed but never written: antd's picker has no HSL panel, and a
    // save format the editor cannot show means dragging one model and
    // recording another.
    expect(COLOR_SAVE_FORMATS).toEqual(['hex', 'hex3', 'rgb', 'hsb']);
    expect(isColor('hsl(120, 100%, 50%)')).toBe(true);
  });

  it("uses the spaced comma form, not the picker library's compact one", () => {
    // `@ant-design/fast-color` emits `rgb(0,255,0)`; the specification fixes
    // the serialized form as `rgb(r, g, b)`.
    expect(serializeColor(green, 'rgb')).toContain(', ');
    expect(serializeColor(green, 'hsb')).toContain(', ');
  });

  it('carries transparency in every format that can hold it', () => {
    expect(serializeColor(half, 'hex')).toBe('#00ff0080');
    expect(serializeColor(parse('rgba(0, 255, 0, 0.5)'), 'rgb')).toBe(
      'rgba(0, 255, 0, 0.5)'
    );
    expect(serializeColor(parse('rgba(0, 255, 0, 0.25)'), 'hsb')).toBe(
      'hsba(120, 100%, 100%, 0.25)'
    );
  });

  it('omits alpha when the color is fully opaque', () => {
    expect(serializeColor(parse('rgba(0, 255, 0, 1)'), 'rgb')).toBe(
      'rgb(0, 255, 0)'
    );
    expect(serializeColor(parse('#00ff00ff'), 'hex')).toBe('#00ff00');
  });

  it('refuses hex3 for a transparent color rather than discarding alpha', () => {
    expect(serializeColor(half, 'hex3')).toBeUndefined();
  });

  it('quantizes hex3 by round(channel / 17), matching the spec vector', () => {
    // Section 18: "#ed5050 becomes #e55, representing #ee5555".
    expect(serializeColor(parse('#ed5050'), 'hex3')).toBe('#e55');
    expect(serializeColor(parse('#ffffff'), 'hex3')).toBe('#fff');
    expect(serializeColor(parse('#000000'), 'hex3')).toBe('#000');
    // Fully opaque eight-digit input takes the same conversion.
    expect(serializeColor(parse('#ed5050ff'), 'hex3')).toBe('#e55');
  });

  it('round-trips each format back to the same color', () => {
    for (const format of COLOR_SAVE_FORMATS) {
      const text = serializeColor(green, format)!;
      expect(parseColor(text)).toEqual(green);
    }
  });

  it('is stable when the same value is saved twice', () => {
    for (const format of COLOR_SAVE_FORMATS) {
      const once = serializeColor(parse('#3a7bd5'), format);
      const twice = serializeColor(parse(once!), format);
      expect(twice).toBe(once);
    }
  });
});

describe('hue normalization', () => {
  it('reduces into [0, 360) and rounds to a whole degree', () => {
    expect(normalizeHue(-30)).toBe(330);
    expect(normalizeHue(360)).toBe(0);
    expect(normalizeHue(719.6)).toBe(0);
    expect(normalizeHue(120.4)).toBe(120);
  });

  it('serializes equivalent hues identically', () => {
    expect(serializeColor(parse('hsb(-240, 100%, 100%)'), 'hsb')).toBe(
      serializeColor(parse('hsb(120, 100%, 100%)'), 'hsb')
    );
    // The same applies to hues arriving as HSL, which is accepted input.
    expect(serializeColor(parse('hsl(-240, 100%, 50%)'), 'hsb')).toBe(
      'hsb(120, 100%, 100%)'
    );
  });

  it('reports achromatic colors as hue 0', () => {
    expect(serializeColor(parse('#808080'), 'hsb')).toBe('hsb(0, 0%, 50%)');
  });
});

describe('save format selection', () => {
  it('falls back to hex for an unrecognized value', () => {
    expect(asColorSaveFormat('rgb')).toBe('rgb');
    expect(asColorSaveFormat('hsb')).toBe('hsb');
    expect(asColorSaveFormat('cmyk')).toBe('hex');
    // Including `hsl`, which the specification lists but this project does not
    // emit - an authored `hsl` stores hex rather than silently doing nothing.
    expect(asColorSaveFormat('hsl')).toBe('hex');
    expect(asColorSaveFormat(undefined)).toBe('hex');
  });

  it('opens the picker on the panel matching the save format', () => {
    expect(pickerFormatFor('hex')).toBe('hex');
    expect(pickerFormatFor('hex3')).toBe('hex');
    expect(pickerFormatFor('rgb')).toBe('rgb');
    expect(pickerFormatFor('hsb')).toBe('hsb');
  });
});

describe('CSS color for a swatch', () => {
  it('converts every stored representation to something a browser paints', () => {
    // `background: hsb(...)` paints nothing, so the stored text can never be
    // handed straight to a style once HSB output exists.
    expect(toCssColor('hsb(120, 100%, 100%)')).toBe('#00ff00');
    expect(toCssColor('hsl(120, 100%, 50%)')).toBe('#00ff00');

    expect(toCssColor('rgb(0, 255, 0)')).toBe('#00ff00');
    expect(toCssColor('#0f0')).toBe('#00ff00');
  });

  it('gives nothing for a value that is not a color', () => {
    expect(toCssColor('teal-ish')).toBeUndefined();
    expect(toCssColor(undefined)).toBeUndefined();
  });
});
