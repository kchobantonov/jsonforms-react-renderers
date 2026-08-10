import type React from 'react';

export type ArkRendererSettings = {
  accentColor?: string;
  borderRadius?: number;
  density?: 'comfortable' | 'compact';
};

export const defaultArkRendererSettings: ArkRendererSettings = {
  accentColor: '#2563eb',
  borderRadius: 6,
  density: 'comfortable',
};

export const createArkRendererStyle = (
  settings: ArkRendererSettings = defaultArkRendererSettings,
  dark = false
) => {
  const radius = settings.borderRadius ?? defaultArkRendererSettings.borderRadius;
  const accent = settings.accentColor ?? defaultArkRendererSettings.accentColor;
  const compact = settings.density === 'compact';

  return {
    '--ark-jsonforms-accent': accent,
    '--ark-jsonforms-radius': `${radius}px`,
    colorScheme: dark ? 'dark' : 'light',
    fontSize: compact ? '13px' : '14px',
  } as React.CSSProperties;
};
