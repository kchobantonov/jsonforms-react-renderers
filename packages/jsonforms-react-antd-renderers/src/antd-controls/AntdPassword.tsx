import { CellProps, WithClassname } from '@jsonforms/core';
import { Input } from 'antd';
import merge from 'lodash/merge';
import React, { useState } from 'react';
import { useDebouncedChange } from '../util';
import { AntdClearableInput } from './AntdClearableInput';
import { AntdRevealButton } from './AntdRevealButton';

const eventToValue = (ev: any) =>
  ev.target.value === '' ? undefined : ev.target.value;

export const AntdPassword = React.memo(function AntdPassword(
  props: CellProps &
    WithClassname & {
      inputProps?: React.ComponentProps<typeof Input>;
    }
) {
  const {
    data,
    config,
    className,
    id,
    enabled,
    uischema,
    path,
    handleChange,
    schema,
    inputProps,
  } = props;
  const appliedUiSchemaOptions = merge({}, config, uischema.options);
  const [inputText, onChange, onClear] = useDebouncedChange(
    handleChange,
    '',
    data,
    path,
    eventToValue
  );
  /*
    Reveal state is local runtime state. The specification is explicit that
    toggling "must not write form data, trigger a value-change event, alter
    validation, or mark the value dirty", and that it is "never serialized into
    data or UI schema".
  */
  const [revealed, setRevealed] = useState(false);

  return (
    <AntdClearableInput
      clearable={appliedUiSchemaOptions.clearable !== false}
      data={data}
      enabled={enabled}
      onClear={onClear}
    >
      {/*
        The reveal and clear controls both go in antd's `suffix` slot. An
        overlaid clear button landed on top of the reveal icon, and the
        `Form.Item` error icon on top of both - three icons in one corner.
        `Input` *composes* `suffix` with the feedback icon
        (`<>{suffix}{hasFeedback && feedbackIcon}</>`) rather than replacing it,
        as `InputNumber` does, so the slot yields reveal / clear / error laid
        out by antd and correct whether or not the value is currently invalid.
      */}
      {(clear) => (
        <Input
          /*
            A plain `Input` with our own toggle, not `Input.Password`.

            antd 6's `Input.Password` wraps whatever `iconRender` returns in a
            `span` that is itself `role="button"`, focusable, and labelled from
            antd's own locale - so putting a real button inside it, which is
            what the accessible name has to live on, nested one interactive
            element inside another: two tab stops for one action, and two
            different names for it ("Show" from antd, "Show password" from the
            form's translator).

            Owning the toggle keeps one control, one name, and that name coming
            from the JSON Forms translator like every other rendered string.
            All `Input.Password` does beyond this is swap the input type, which
            is one line.
          */
          type={revealed ? 'text' : 'password'}
          suffix={
            <>
              <AntdRevealButton
                revealed={revealed}
                onToggle={() => setRevealed((shown) => !shown)}
                disabled={!enabled}
              />
              {clear}
            </>
          }
          value={inputText}
          onChange={onChange}
          className={className}
          id={id}
          disabled={!enabled}
          autoFocus={appliedUiSchemaOptions.focus}
          maxLength={schema.maxLength}
          placeholder={appliedUiSchemaOptions.placeholder}
          {...inputProps}
        />
      )}
    </AntdClearableInput>
  );
});
