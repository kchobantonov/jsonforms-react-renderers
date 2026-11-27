import React from 'react';
import { useContainerValidation } from './validationIndicator';
export const ItemValidationIndicator = ({
  Indicator,
  path,
  options,
  config,
}: {
  Indicator: React.ComponentType<{ count: number }>;
  path: string;
  options?: Record<string, any>;
  config?: Record<string, any>;
}) => {
  const indicator = useContainerValidation(
    { type: 'Control', scope: '#', options } as any,
    path,
    config,
    false,
  );
  return indicator.show ? <Indicator count={indicator.count} /> : null;
};
