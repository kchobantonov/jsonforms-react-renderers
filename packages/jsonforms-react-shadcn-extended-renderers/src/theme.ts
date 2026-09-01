import type React from 'react';

export type ShadcnRendererSettings = {
  accentColor?: string;
  borderRadius?: number;
  density?: 'comfortable' | 'compact';
};

export const defaultShadcnRendererSettings: ShadcnRendererSettings = {
  accentColor: '#0f172a',
  borderRadius: 6,
  density: 'comfortable',
};

export const createShadcnRendererStyle = (
  settings: ShadcnRendererSettings = defaultShadcnRendererSettings,
  dark = false
) => {
  const radius =
    settings.borderRadius ?? defaultShadcnRendererSettings.borderRadius;
  const configuredAccent =
    settings.accentColor ?? defaultShadcnRendererSettings.accentColor;
  const accent =
    dark && configuredAccent === defaultShadcnRendererSettings.accentColor
      ? '#f8fafc'
      : configuredAccent;
  const compact = settings.density === 'compact';

  return {
    '--shadcn-jsonforms-accent': accent,
    '--shadcn-jsonforms-radius': `${radius}px`,
    colorScheme: dark ? 'dark' : 'light',
    fontSize: compact ? '13px' : '14px',
  } as React.CSSProperties;
};
