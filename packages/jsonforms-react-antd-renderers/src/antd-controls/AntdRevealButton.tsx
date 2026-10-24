import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import { Tooltip } from 'antd';
import React from 'react';
import { useI18n } from '../util/translate';

export interface AntdRevealButtonProps {
  revealed: boolean;
  /** Toggles the reveal state. */
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * The show/hide control for a masked value.
 *
 * A real button whose accessible name states the **action it will perform**
 * rather than the current state - "Show password" while the value is hidden -
 * which is what section 18 asks for. Enter or Space activates it natively.
 *
 * It carries a tooltip with the same wording, for the same reason the clear
 * button does: the control is an icon, and an icon with no visible name is
 * guessable at best. antd renders no tooltip on its own reveal icon - it gives
 * the wrapper an `aria-label` and stops there - so this is ours to supply, not
 * something the library prevents.
 *
 * Deliberately no `aria-pressed`. A toggle button either names its state and
 * reports pressed, or names the action it will perform; doing both describes
 * the control twice and contradicts itself, since "Show password" is not a
 * thing that can be pressed or unpressed. The specification asks for the
 * action wording, so that is what this reports.
 *
 * Toggling is presentation only. The specification is explicit that it "must
 * not write form data, trigger a value-change event, alter validation, or mark
 * the value dirty", and that reveal state is "never serialized into data or UI
 * schema".
 */
export const AntdRevealButton = ({
  revealed,
  onToggle,
  disabled = false,
}: AntdRevealButtonProps) => {
  const t = useI18n();
  const name = t(revealed ? 'password.hide' : 'password.show');
  return (
    <Tooltip title={name}>
      <button
        aria-label={name}
        data-password-toggle
        disabled={disabled}
        // Keeps focus in the text field, the way antd's own icon does, so
        // revealing does not move the caret or close the field's clear button.
        onMouseDown={(event) => event.preventDefault()}
        onClick={onToggle}
        style={{
          background: 'none',
          border: 0,
          color: 'inherit',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          padding: 0,
        }}
        tabIndex={0}
        type='button'
      >
        {revealed ? (
          <EyeOutlined rev={undefined} />
        ) : (
          <EyeInvisibleOutlined rev={undefined} />
        )}
      </button>
    </Tooltip>
  );
};
