import React, { ReactNode, useState } from 'react';
import { AntdClearValueButton } from './AntdClearValueButton';

export interface AntdClearableInputProps {
  /**
   * The control, or a function that places the clear button itself.
   *
   * The plain form overlays the button on the control. The function form hands
   * it back so a control can put it in antd's `suffix` slot instead, which is
   * what `Input`-based controls with their own trailing icon need - see
   * `inline` in `AntdClearValueButton`.
   */
  children: ReactNode | ((clear: ReactNode) => ReactNode);
  clearable?: boolean;
  data: unknown;
  enabled: boolean;
  onClear: () => void;
  /** Distance from the trailing edge; see `AntdClearValueButton`. */
  offset?: number;
}

export const AntdClearableInput = ({
  children,
  clearable,
  data,
  enabled,
  onClear,
  offset,
}: AntdClearableInputProps) => {
  const [active, setActive] = useState(false);
  const slotted = typeof children === 'function';
  const clear = (
    <AntdClearValueButton
      clearable={clearable}
      data={data}
      enabled={enabled}
      inline={slotted}
      offset={offset}
      onClear={onClear}
      visible={active}
    />
  );

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
      {slotted
        ? (children as (clear: ReactNode) => ReactNode)(clear)
        : children}
      {slotted ? null : clear}
    </span>
  );
};
