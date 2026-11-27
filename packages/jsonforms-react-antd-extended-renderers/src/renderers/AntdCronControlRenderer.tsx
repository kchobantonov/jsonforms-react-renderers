import { PickerFormItem } from '../components/PickerFormItem';
import {
  AntdClearableInput,
  usePreTouchErrors,
} from '@chobantonov/jsonforms-react-antd-renderers';
import ScheduleOutlined from '@ant-design/icons/ScheduleOutlined';
import {
  and,
  ControlElement,
  ControlProps,
  formatIs,
  isStringControl,
  optionIs,
  or,
  RankedTester,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  Button,
  Flex,
  Input,
  Popover,
  Select,
  Space,
  Typography,
  theme as antTheme,
} from 'antd';
import React from 'react';
import {
  useCronPicker,
  CRON_FIELDS,
  CronField,
  CronPeriod,
  DEFAULT_CRON,
  FIELD_RANGE,
  formatField,
  labelFor,
  parseField,
} from '@chobantonov/jsonforms-react-extended-renderers';

/**
 * Selected the two ways section 5 describes, like every other temporal control.
 *
 * `format: "cron"` in the **schema** is the route that also gives a validator
 * something to check, where the profile defines the keyword; `options.format`
 * in the **UI schema** picks the same renderer for a plain string and leaves
 * validation to `pattern`. Rank 3 is the shared rank for a format-selected
 * control.
 */
export const antdCronControlTester: RankedTester = rankWith(
  3,
  and(
    isStringControl,
    or(formatIs('cron'), and(uiTypeIs('Control'), optionIs('format', 'cron'))),
  ),
);

/** Offered coarsest-repeating first, which is how a schedule is described out loud. */
const periods: CronPeriod[] = [
  'year',
  'month',
  'week',
  'day',
  'hour',
  'minute',
  'second',
];

/** The width of the label column, in characters, from the longest label shown. */
const labelColumn = 15;

/**
 * One field's choices, or its text when it has none.
 *
 * A multi-select rather than a syntax: picking Monday and Friday is the natural
 * way to say `MON,FRI`, and the expression underneath is written from the
 * selection rather than typed. An empty selection is **every value** - which is
 * what `*` means and what clearing this field does, so the clear action and the
 * schedule agree.
 *
 * A field whose value is `L`, `W` or `#` has no list to offer, so it is shown
 * as the text it is. That is the whole of the special-syntax support: it is
 * never reinterpreted, never widened into a list that would mean something
 * else, and never taken away from whoever wrote it.
 */
const FieldPicker = ({
  field,
  text,
  disabled,
  label,
  onChange,
}: {
  field: CronField;
  text: string;
  disabled: boolean;
  label: (key: any, values?: Record<string, string | number>) => string;
  onChange: (text: string) => void;
}) => {
  const name = label(`cron.${field}` as any);
  const values = parseField(text, field);
  const [low, high] = FIELD_RANGE[field];

  const addon = (
    <Space.Addon
      disabled={disabled}
      style={{ width: `${labelColumn}ch`, justifyContent: 'flex-start' }}
    >
      {name}
    </Space.Addon>
  );

  if (values === undefined) {
    return (
      <AntdClearableInput
        data={text}
        enabled={!disabled}
        onClear={() => onChange('')}
      >
        {(clear) => (
          <Space.Compact block>
            {addon}
            <Input
              style={{ flex: 1, minWidth: 0 }}
              disabled={disabled}
              value={text}
              aria-label={name}
              suffix={clear}
              onChange={(event) => onChange(event.currentTarget.value)}
            />
          </Space.Compact>
        )}
      </AntdClearableInput>
    );
  }

  /*
    "Every" is the empty selection, so a field standing for all of its values
    shows nothing chosen rather than every chip at once - which for seconds
    would be sixty of them.
  */
  const selected = values.length === high - low + 1 ? [] : values;

  return (
    <Space.Compact block>
      {addon}
      <Select
        style={{ flex: 1, minWidth: 0 }}
        mode='multiple'
        disabled={disabled}
        value={selected}
        placeholder={label('cron.every')}
        aria-label={name}
        maxTagCount='responsive'
        /*
          antd's own clear rather than the shared button: this is a row of the
          picker and not the control's value, and what it clears to is "every"
          rather than nothing at all.
        */
        allowClear
        options={Array.from({ length: high - low + 1 }, (_, index) => ({
          value: low + index,
          label: labelFor(low + index, field),
        }))}
        onChange={(next: number[]) => onChange(formatField(next, field))}
      />
    </Space.Compact>
  );
};

/**
 * When something runs, as a schedule rather than as six fields of punctuation.
 *
 * Built like the duration control: **one field, not two widgets**. The
 * expression is the value, it stays editable as text, and the picker hangs off
 * an icon inside the input rather than sitting above it. Clearing follows the
 * shared clear-value contract - `AntdClearableInput`, so the button has a
 * localized name, appears on hover or focus, and returns the property to a
 * missing state rather than to an empty string.
 *
 * The picker asks **how often it repeats** first, because that decides which of
 * the six fields are worth showing: a schedule that runs every hour has nothing
 * to say about which day it is, and five dropdowns reading "every" is a form
 * that hides its own answer. Each field it does show is a list to choose from,
 * and an empty one means every value.
 *
 * The period is a **lens, not data**. It selects nothing on its own - a
 * property with no schedule in it opens with no period chosen and no rows - and
 * the one thing changing it writes is the conditions it is about to hide. What
 * does fill a value in is choosing one: see `withTimeDefaults`, because in cron
 * a field left alone means *every* value, so "nine o'clock" with nothing else
 * said is 3600 executions rather than one.
 *
 * Two things it will not do. It **edits only the field that was touched**, so
 * the other five keep the spelling they were written with. And it **does not
 * write at all** unless the schedule actually changed: OK on an untouched
 * picker leaves the value alone, which is the rule the duration control keeps
 * for `P1DT0H` against `P1D`.
 */
export const AntdCronControl = (props: ControlProps) => {
  const { token } = antTheme.useToken();
  const {
    label,
    expression,
    open,
    setOpen,
    text,
    period,
    options,
    showActions,
    disabled,
    localError,
    draft,
    changeField,
    changeText,
    changePeriod,
    editedProblem,
    shownFields,
    hasCustomField,
    openOn,
    accept,
  } = useCronPicker(props);
  const { errors: filteredErrors, onBlur: onBlurTouch } = usePreTouchErrors({
    errors: props.errors,
    path: props.path,
    schema: props.schema,
    uischema: props.uischema as ControlElement,
    config: props.config,
  });
  if (!props.visible) return null;

  const picker = (
    <Flex vertical gap='small' style={{ width: 340 }}>
      <Space.Compact block>
        <Space.Addon
          disabled={disabled}
          style={{ width: `${labelColumn}ch`, justifyContent: 'flex-start' }}
        >
          {label('cron.repeats')}
        </Space.Addon>
        <Select
          style={{ flex: 1, minWidth: 0 }}
          disabled={disabled}
          value={period}
          placeholder={label('cron.chooseRepeats')}
          aria-label={label('cron.repeats')}
          options={periods.map((each) => ({
            value: each,
            label: label(`cron.period.${each}` as any),
          }))}
          onChange={(value) => changePeriod(value as CronPeriod)}
        />
      </Space.Compact>

      {shownFields.map((field) => (
        <FieldPicker
          key={field}
          field={field}
          text={draft[CRON_FIELDS.indexOf(field)] ?? '*'}
          disabled={disabled}
          label={label}
          onChange={(value) => changeField(field, value)}
        />
      ))}

      {hasCustomField && (
        <Typography.Text
          type='secondary'
          style={{ fontSize: token.fontSizeSM }}
        >
          {label('cron.advanced')}
        </Typography.Text>
      )}

      {/*
        The expression the picker is building, inside the picker.

        Somewhere to see what a selection just wrote without closing the panel,
        and the way in for anything the dropdowns cannot say. With `showActions`
        the field below shows what is saved and this shows what is being edited.
      */}
      <AntdClearableInput
        data={text}
        enabled={!disabled}
        onClear={() => changeText('')}
      >
        {(clear) => (
          <Space.Compact block>
            <Space.Addon
              disabled={disabled}
              style={{
                width: `${labelColumn}ch`,
                justifyContent: 'flex-start',
              }}
            >
              {label('cron.expression')}
            </Space.Addon>
            <Input
              style={{ flex: 1, minWidth: 0 }}
              disabled={disabled}
              value={text}
              placeholder={DEFAULT_CRON}
              status={editedProblem ? 'error' : undefined}
              aria-label={label('cron.expression')}
              suffix={clear}
              onChange={(event) => changeText(event.currentTarget.value)}
            />
          </Space.Compact>
        )}
      </AntdClearableInput>

      {showActions && (
        <Flex justify='end' gap='small'>
          <Button onClick={() => setOpen(false)}>{label('cron.cancel')}</Button>
          <Button
            type='primary'
            disabled={disabled || Boolean(editedProblem)}
            onClick={accept}
          >
            {label('cron.ok')}
          </Button>
        </Flex>
      )}
    </Flex>
  );

  /**
   * Opened on what the field currently says, and on nothing when it says
   * nothing.
   *
   * So Cancel restores it, and a schedule edited as text is what the picker
   * picks up rather than whatever was left behind last time.
   */
  return (
    <PickerFormItem props={props} error={localError || filteredErrors}>
      {/*
        One field, like the duration and color controls: the expression stays
        editable as text and the picker hangs off an icon inside the input
        rather than sitting beside it as a second widget.
      */}
      <AntdClearableInput
        clearable={options.clearable !== false}
        data={props.data}
        enabled={!disabled}
        onClear={() => props.handleChange(props.path, undefined)}
      >
        {(clear: React.ReactNode) => (
          <Input
            id={props.id}
            disabled={disabled}
            value={expression}
            placeholder={options.placeholder ?? DEFAULT_CRON}
            autoFocus={options.focus}
            status={localError || filteredErrors ? 'error' : undefined}
            onChange={(event) =>
              props.handleChange(
                props.path,
                event.currentTarget.value || undefined,
              )
            }
            onBlur={onBlurTouch}
            styles={{
              prefix: { lineHeight: 0, display: 'flex', alignItems: 'center' },
            }}
            suffix={clear}
            prefix={
              <Popover
                content={picker}
                open={open}
                placement='bottomLeft'
                trigger='click'
                onOpenChange={openOn}
              >
                <ScheduleOutlined
                  role='button'
                  aria-label={label('cron.choose')}
                  style={{
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    color: token.colorTextTertiary,
                  }}
                />
              </Popover>
            }
          />
        )}
      </AntdClearableInput>
    </PickerFormItem>
  );
};

export const AntdCronControlRenderer =
  withJsonFormsControlProps(AntdCronControl);
