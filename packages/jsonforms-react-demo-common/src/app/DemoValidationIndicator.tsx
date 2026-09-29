import React from 'react';
import { CircleAlert } from 'lucide-react';
import type { DemoUi } from './types';

export const formatDemoErrors = (errors: unknown[]) =>
  errors
    .map((error) => {
      if (typeof error === 'string') return error;
      if (!error || typeof error !== 'object') return String(error);
      const { instancePath, message, params } = error as {
        instancePath?: string;
        message?: string;
        params?: { missingProperty?: string };
      };
      const path = [instancePath, params?.missingProperty]
        .filter(Boolean)
        .join('/');
      return `${path ? `${path}: ` : ''}${message || 'Validation error'}`;
    })
    .join('\n');

export const DemoValidationIndicator = ({
  errors,
  Tooltip,
}: {
  errors: unknown[];
  Tooltip?: DemoUi['Tooltip'];
}): React.JSX.Element | null => {
  if (!errors.length) return null;
  const content = formatDemoErrors(errors);
  const indicator = (
    <span
      tabIndex={0}
      aria-label={`${errors.length} validation errors: ${content}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      <CircleAlert size={16} aria-hidden='true' />
      <span aria-hidden='true'>{errors.length}</span>
    </span>
  );
  return Tooltip ? (
    <Tooltip content={content}>{indicator}</Tooltip>
  ) : (
    <span title={content}>{indicator}</span>
  );
};
