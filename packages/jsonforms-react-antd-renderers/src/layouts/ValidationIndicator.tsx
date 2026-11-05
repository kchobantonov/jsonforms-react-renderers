import { theme as antTheme } from 'antd';
import React from 'react';
import { useI18n } from '../util/translate';
import { ContainerIndicator, ErrorIcon } from './ContainerIndicator';

export interface ValidationIndicatorProps {
  /** Eligible errors at or below the container, or undefined to omit it. */
  count?: number;

}

/**
 * The marker a container shows when something below it fails validation.
 *
 * Deliberately not color alone: it carries a localized accessible name and a
 * tooltip available on hover and keyboard focus, as a bare colored glyph
 * communicates nothing to a screen reader and nothing on touch.
 */
export const ContainerValidationIndicator = ({
  count,
}: ValidationIndicatorProps) => {
  const { token } = antTheme.useToken();
  const t = useI18n();
  const key =
    count === undefined
      ? 'validation.containerHasErrors'
      : count === 1
        ? 'validation.containerError'
        : 'validation.containerErrors';
  // `useI18n` fills `{count}` itself, so the hand-rolled replace is gone.
  const label = t(key, { count });
  return (
    <ContainerIndicator
      label={label}
      color={token.colorError}
      marker={{
        'data-container-validation-indicator': true,
        'data-error-count': count,
      }}
    >
      <ErrorIcon />
    </ContainerIndicator>
  );
};

export default ContainerValidationIndicator;
