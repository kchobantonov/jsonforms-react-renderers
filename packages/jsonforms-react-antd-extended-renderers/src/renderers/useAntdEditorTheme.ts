import { theme as antTheme } from 'antd';
import type { EditorTheme } from '@chobantonov/jsonforms-react-extended-renderers';

/**
 * antd exposes no `isDark` flag, but `colorBgBase` is the seed background the
 * active algorithm sets (#fff for defaultAlgorithm, #000 for darkAlgorithm), so
 * its luminance is an exact read of the configured theme - unlike inspecting the
 * DOM it works even when the host paints no background of its own.
 */
export const useAntdEditorTheme = (): EditorTheme => {
  const { token } = antTheme.useToken();
  // antd's seed leaves colorBgBase as '' unless the host sets it, and the
  // algorithms do not fill it in - so `??` is not enough, empty strings have to
  // be skipped too. colorBgContainer is always a real color.
  const base = firstColor(token.colorBgBase, token.colorBgContainer);
  return {
    isDark: isDark(base),
    background: token.colorBgContainer,
    foreground: token.colorText,
    border: token.colorBorderSecondary ?? token.colorBorder,
    accent: token.colorPrimary,
    headerBackground: token.colorFillAlter ?? token.colorFillQuaternary,
    headerForeground: token.colorTextHeading ?? token.colorText,
    rowHover: token.controlItemBgHover,
    selectedRowBackground: token.controlItemBgActive,
    fontFamily: token.fontFamily,
  };
};

const firstColor = (...candidates: unknown[]): string | undefined =>
  candidates.find(
    (value): value is string => typeof value === 'string' && value.trim() !== ''
  );

const isDark = (color: unknown): boolean | undefined => {
  if (typeof color !== 'string') return undefined;
  const rgb = color.startsWith('#')
    ? hexToRgb(color)
    : color
        .match(/[\d.]+/g)
        ?.map(Number)
        .slice(0, 3);
  if (!rgb || rgb.length < 3) return undefined;
  return rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 < 128;
};

const hexToRgb = (hex: string): number[] | undefined => {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;
  if (full.length < 6) return undefined;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};
