import {
  useExtendedTranslator,
  useDurationControl,
  durationComponentFields,
  durationFieldMax,
} from '@chobantonov/jsonforms-react-extended-renderers';
import {
  ControlFormItem,
  usePreTouchErrors,
  useClearAffordance,
  useI18n,
} from '@chobantonov/jsonforms-react-antd-renderers';
import ClockCircleOutlined from '@ant-design/icons/ClockCircleOutlined';
import {
  and,
  ControlProps,
  formatIs,
  isStringControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  Button,
  Flex,
  Input,
  InputNumber,
  Popover,
  Segmented,
  Select,
  Space,
  theme as antTheme,
} from 'antd';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import React from 'react';

export const antdDurationControlTester: RankedTester = rankWith(
  3,
  and(isStringControl, formatIs('duration'))
);

/** Each picker component's translation key, so none is a bare English word. */
const fieldLabelKeys = {
  weeks: 'duration.weeks',
  years: 'duration.years',
  months: 'duration.months',
  days: 'duration.days',
  hours: 'duration.hours',
  minutes: 'duration.minutes',
  seconds: 'duration.seconds',
} as const;

export const AntdDurationControl = (props: ControlProps) => {
  const { token } = antTheme.useToken();
  /*
    See `usePreTouchErrors` in the base package: the filtered message, plus the
    touch state it needs. Unchanged unless filtering is switched on.
  */
  const { errors: filteredErrors, onBlur: onBlurTouch } = usePreTouchErrors({
    errors: props.errors,
    path: props.path,
    schema: props.schema,
    uischema: props.uischema as any,
    config: props.config,
  });

  const t = useExtendedTranslator();
  const label = useI18n();
  const state = useDurationControl(props);
  const { open, draft: parts } = state;
  // hooks run before the visibility guard
  const { allowClear, affordanceProps } = useClearAffordance(
    Boolean(state.value)
  );
  if (!props.visible) return null;
  const value = state.value;
  const localError = state.error;
  /*
    Only the units in play, and weeks as a mode rather than a row.

    The previous picker drew all seven components, so "2 days, 3 hours" was two
    useful rows among five zeros - and Weeks sat first, greyed, with nothing
    saying that it cannot be combined with the others. Both are fixed here;
    see `useDurationControl` for why weeks is a mode.
  */
  /*
    The unit column's width, in characters, taken from the longest label the
    panel can show rather than from the rows it happens to be showing: adding
    or removing a unit must not resize the ones already on screen.
  */
  const unitColumn =
    Math.max(
      ...(state.mode === 'weeks'
        ? ['weeks' as const]
        : durationComponentFields
      ).map((field) => label(fieldLabelKeys[field]).length)
    ) + 2;
  const picker = (
    <Flex vertical gap='small' style={{ width: 300 }}>
      <Segmented
        block
        size='small'
        disabled={state.disabled}
        value={state.mode}
        onChange={(next) => state.setMode(next as 'weeks' | 'components')}
        options={[
          { value: 'components', label: label('duration.modeComponents') },
          { value: 'weeks', label: label('duration.modeWeeks') },
        ]}
      />
      {state.activeFields.map((field) => (
        /*
          A two-column grid, not a flex row. A flex item keeps its natural
          width, which is why the number-and-unit group sat at about half the
          panel while the add control below it ran the full width; a grid item
          stretches, and the second column stays open whether or not a remove
          button is drawn, so the rows line up with each other and with the
          add control.
        */
        <div
          key={field}
          style={{
            display: 'grid',
            gridTemplateColumns: `1fr ${token.controlHeight}px`,
            alignItems: 'center',
            columnGap: token.paddingXXS,
          }}
        >
          {/*
            `Space.Compact` rather than the input's `addonAfter`: antd 6
            deprecates the addon props on `InputNumber` in favour of this and
            warns about them in development. It also renders the addon itself,
            which is what lets the unit column below have a width.
          */}
          <Space.Compact block>
            <InputNumber
              style={{ flex: 1, minWidth: 0 }}
              /*
                Floored at zero and capped only at the exact-integer limit:
                a duration's components are quantities, so `PT90M` and
                `P400D` are ordinary values, not overflow.
              */
              min={0}
              max={durationFieldMax}
              disabled={state.disabled}
              aria-label={label(fieldLabelKeys[field])}
              onChange={(next) => state.changePart(field, Number(next ?? 0))}
              value={parts[field]}
            />
            <Space.Addon
              disabled={state.disabled}
              style={{
                /*
                  One width for every unit in the panel, measured from the
                  longest label rather than fixed in pixels: the labels are
                  translated, and "Minutes" and "Минути" are not the same
                  width. Sizing to the longest keeps every input box the same
                  size in every locale instead of leaving a ragged edge.
                */
                width: `${unitColumn}ch`,
                justifyContent: 'center',
              }}
            >
              {label(fieldLabelKeys[field])}
            </Space.Addon>
          </Space.Compact>
          {state.mode === 'components' && state.activeFields.length > 1 ? (
            <Button
              size='small'
              type='text'
              disabled={state.disabled}
              aria-label={label('duration.removeUnit', {
                unit: label(fieldLabelKeys[field]),
              })}
              onClick={() => state.removeField(field)}
            >
              <CloseOutlined />
            </Button>
          ) : (
            /* Holds the column open so a row without a button still aligns. */
            <span aria-hidden='true' />
          )}
        </div>
      ))}
      {state.addableFields.length > 0 && (
        <Select
          size='small'
          /* Stops where the inputs do: the button column plus its gap. */
          style={{
            width: `calc(100% - ${token.controlHeight + token.paddingXXS}px)`,
          }}
          value={null}
          disabled={state.disabled}
          placeholder={label('duration.addUnit')}
          aria-label={label('duration.addUnit')}
          onChange={(field) => state.addField(field)}
          options={state.addableFields.map((field) => ({
            value: field,
            label: label(fieldLabelKeys[field]),
          }))}
        />
      )}
      {state.showActions && (
        <Flex justify='end' gap='small'>
          <Button onClick={() => state.close()}>
            {/*
              The temporal-action convention: an explicit label is translated
              as a key first and used literally if it does not resolve.
            */}
            {state.options.cancelLabel
              ? t(state.options.cancelLabel) ?? state.options.cancelLabel
              : label('duration.cancel')}
          </Button>
          <Button
            onClick={() => {
              state.apply();
            }}
            type='primary'
          >
            {state.options.okLabel
              ? t(state.options.okLabel) ?? state.options.okLabel
              : label('duration.ok')}
          </Button>
        </Flex>
      )}
    </Flex>
  );
  return (
    <ControlFormItem
      id={props.id}
      required={props.required}
      errors={localError || filteredErrors || undefined}
      label={props.label}
      help={localError || filteredErrors || props.description}
    >
      {/*
        One field, like the color control: the ISO 8601 value stays editable as
        text and the picker hangs off an icon inside the input rather than
        sitting beside it as a second widget.
      */}
      <Input
        allowClear={allowClear}
        {...affordanceProps}
        disabled={state.disabled}
        onChange={(event) =>
          props.handleChange(props.path, event.currentTarget.value || undefined)
        }
        onBlur={onBlurTouch}
        placeholder={state.options.placeholder ?? 'P1DT2H'}
        autoFocus={state.options.focus}
        status={localError || filteredErrors ? 'error' : undefined}
        value={value ?? ''}
        styles={{
          prefix: { lineHeight: 0, display: 'flex', alignItems: 'center' },
        }}
        prefix={
          <Popover
            content={picker}
            onOpenChange={(next) => (next ? state.openPicker() : state.close())}
            open={open}
            placement='bottomLeft'
            trigger='click'
          >
            <ClockCircleOutlined
              role='button'
              aria-label={t('editor.chooseDuration')}
              style={{
                cursor: state.disabled ? 'not-allowed' : 'pointer',
                color: token.colorTextTertiary,
              }}
            />
          </Popover>
        }
      />
    </ControlFormItem>
  );
};

export const AntdDurationControlRenderer =
  withJsonFormsControlProps(AntdDurationControl);
