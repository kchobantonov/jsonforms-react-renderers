import CloseCircleFilled from '@ant-design/icons/CloseCircleFilled';
import { Button, Tooltip } from 'antd';
import React from 'react';
import { useI18n } from '../util/translate';

/** Enough to clear a `Form.Item` feedback icon and the input's padding. */
export const CLEAR_OFFSET = 24;

/**
 * Enough to also clear `InputNumber`'s stepper handles, which antd reveals on
 * hover in the same corner - the default offset put the button on top of them.
 * 22px is antd's handler-wrap width.
 */
export const CLEAR_OFFSET_WITH_HANDLES = CLEAR_OFFSET + 22;

export interface AntdClearValueButtonProps {
  clearable?: boolean;
  data: unknown;
  enabled: boolean;
  onClear: () => void;
  visible?: boolean;
  /**
   * Distance from the trailing edge, in pixels.
   *
   * The button is positioned over the control rather than handed to antd's
   * `suffix` slot, because `Form.Item` feedback *replaces* that slot rather
   * than composing with it - `suffix: suffixNode || suffix` in antd's
   * `InputNumber` - so a field with a validation error would lose its clear
   * button exactly when someone wants it.
   *
   * The default clears a feedback icon. A control that also shows stepper
   * handles needs more; see `CLEAR_OFFSET_WITH_HANDLES`.
   *
   * Ignored when {@link AntdClearValueButtonProps.inline} is set.
   */
  offset?: number;
  /**
   * Render in the normal flow instead of over the control.
   *
   * `Input` - unlike `InputNumber` - *composes* its `suffix` with the
   * `Form.Item` feedback icon (`<>{suffix}{hasFeedback && feedbackIcon}</>`),
   * so a control built on it can put this button in that slot and let antd lay
   * the row out. An `Input.Password` has three trailing affordances - reveal,
   * clear and the error icon - and no fixed offset places the middle one
   * correctly in both states: the feedback icon is only there while the value
   * is invalid, so an offset that clears it leaves a gap when it is not.
   */
  inline?: boolean;
}

export const AntdClearValueButton = ({
  clearable = true,
  data,
  enabled,
  onClear,
  visible = true,
  offset = CLEAR_OFFSET,
  inline = false,
}: AntdClearValueButtonProps) => {
  const t = useI18n();
  const populated = data !== undefined && data !== null && data !== '';
  if (!clearable || !enabled || !populated) return null;

  return (
    <Tooltip title={t('control.clearValue')}>
      <Button
        aria-label={t('control.clearValue')}
        icon={<CloseCircleFilled />}
        onClick={(event) => {
          event.stopPropagation();
          onClear();
        }}
        onMouseDown={(event) => event.preventDefault()}
        shape='circle'
        size='small'
        style={{
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 120ms ease',
          ...(inline
            ? {}
            : {
                insetBlockStart: '50%',
                insetInlineEnd: offset,
                position: 'absolute',
                transform: 'translateY(-50%)',
                zIndex: 2,
              }),
        }}
        type='text'
      />
    </Tooltip>
  );
};
