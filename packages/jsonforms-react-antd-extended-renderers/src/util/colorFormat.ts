import type { ColorSaveFormat } from '@chobantonov/jsonforms-react-renderer-common/colorFormat';
export {
  COLOR_SAVE_FORMATS,
  DEFAULT_COLOR_SAVE_FORMAT,
  asColorSaveFormat,
  normalizeHue,
  parseColor,
  isColor,
  isTransparent,
  hslToRgb,
  hsbToRgb,
  rgbToHsb,
  serializeColor,
  toCssColor,
  placeholderKeyFor,
} from '@chobantonov/jsonforms-react-renderer-common/colorFormat';
export type {
  ColorSaveFormat,
  Rgba,
} from '@chobantonov/jsonforms-react-renderer-common/colorFormat';

/**
 * Which of antd's three picker panels matches a save format.
 *
 * Total, because every save format is one the picker can edit - that is why
 * `hsl` output was dropped. `hex3` edits on the hex panel and is quantized on
 * commit; it is a narrower hex, not a different model.
 */
export const pickerFormatFor = (
  format: ColorSaveFormat
): 'hex' | 'rgb' | 'hsb' => {
  switch (format) {
    case 'rgb':
      return 'rgb';
    case 'hsb':
      return 'hsb';
    case 'hex':
    case 'hex3':
    default:
      return 'hex';
  }
};
