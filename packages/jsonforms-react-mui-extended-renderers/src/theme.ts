import { createTheme, Theme } from '@mui/material/styles';

export type MuiInputVariant = 'outlined' | 'filled' | 'standard';
export type MuiDensity = 'comfortable' | 'compact';

export type MuiRendererSettings = {
  inputVariant?: MuiInputVariant;
  density?: MuiDensity;
  primaryColor?: string;
  borderRadius?: number;
  fontFamily?: string;
  disableAnimations?: boolean;
};

export const defaultMuiRendererSettings: Required<MuiRendererSettings> = {
  inputVariant: 'outlined',
  density: 'comfortable',
  primaryColor: '#1976d2',
  borderRadius: 8,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  disableAnimations: false,
};

export const normalizeMuiRendererSettings = (
  settings: MuiRendererSettings = {}
): Required<MuiRendererSettings> => ({
  ...defaultMuiRendererSettings,
  ...settings,
  borderRadius: Number.isFinite(Number(settings.borderRadius))
    ? Number(settings.borderRadius)
    : defaultMuiRendererSettings.borderRadius,
  disableAnimations: Boolean(settings.disableAnimations),
});

export const createJsonFormsMuiTheme = (
  settings: MuiRendererSettings = {},
  dark = false,
  rtl = false
): Theme => {
  const normalized = normalizeMuiRendererSettings(settings);
  const compact = normalized.density === 'compact';

  return createTheme({
    direction: rtl ? 'rtl' : 'ltr',
    palette: {
      mode: dark ? 'dark' : 'light',
      primary: {
        main: normalized.primaryColor,
      },
      background: {
        default: dark ? '#111827' : '#ffffff',
        paper: dark ? '#182235' : '#ffffff',
      },
    },
    shape: {
      borderRadius: normalized.borderRadius,
    },
    typography: {
      fontFamily: normalized.fontFamily,
    },
    transitions: normalized.disableAnimations
      ? {
          create: () => 'none',
          duration: {
            shortest: 0,
            shorter: 0,
            short: 0,
            standard: 0,
            complex: 0,
            enteringScreen: 0,
            leavingScreen: 0,
          },
        }
      : undefined,
    components: {
      MuiButton: {
        defaultProps: {
          size: compact ? 'small' : 'medium',
        },
      },
      MuiFormControl: {
        defaultProps: {
          margin: compact ? 'dense' : 'normal',
          size: compact ? 'small' : 'medium',
          variant: normalized.inputVariant,
        },
      },
      MuiTextField: {
        defaultProps: {
          margin: compact ? 'dense' : 'normal',
          size: compact ? 'small' : 'medium',
          variant: normalized.inputVariant,
        },
      },
      MuiSelect: {
        defaultProps: {
          size: compact ? 'small' : 'medium',
          variant: normalized.inputVariant,
        },
      },
    },
  });
};
