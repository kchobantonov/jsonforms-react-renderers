import React, { ReactNode, useState } from 'react';
import { AntdClearValueButton } from './AntdClearValueButton';

export interface AntdClearableInputProps {
  children: ReactNode;
  clearable?: boolean;
  data: unknown;
  enabled: boolean;
  onClear: () => void;
}

export const AntdClearableInput = ({
  children,
  clearable,
  data,
  enabled,
  onClear,
}: AntdClearableInputProps) => {
  const [active, setActive] = useState(false);

  return (
    <span
      className='jsonforms-antd-clearable-input'
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setActive(false);
        }
      }}
      onFocusCapture={() => setActive(true)}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      style={{ display: 'block', minWidth: 0, position: 'relative' }}
    >
      {children}
      <AntdClearValueButton
        clearable={clearable}
        data={data}
        enabled={enabled}
        onClear={onClear}
        visible={active}
      />
    </span>
  );
};
