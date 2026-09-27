import {
  ControlFormItem,
  usePreTouchErrors,
  useClearAffordance,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { ControlProps, RankedTester } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { ColorPicker, Input, theme as antTheme } from 'antd';
import type { AggregationColor } from 'antd/es/color-picker/color';
import type { ColorFormatType } from 'antd/es/color-picker/interface';
import {
  extendedColorTester,
  resolveExtendedOption,
  useExtendedTranslator,
} from '@chobantonov/jsonforms-react-extended-renderers';
import React, { useState } from 'react';
import {
  DEFAULT_COLOR_SAVE_FORMAT,
  Rgba,
  asColorSaveFormat,
  parseColor,
  pickerFormatFor,
  placeholderKeyFor,
  serializeColor,
  toCssColor,
} from '../util/colorFormat';

/**
 * Selection follows section 18: schema `format: "color"` **or** UI
 * `options.format: "color"` on a plain string. The shared tester carries both;
 * the antd-local one used to test the schema format alone, so a UI-driven
 * color field on an unannotated string silently rendered as a text box.
 */
export const antdColorControlTester: RankedTester = extendedColorTester;

/** antd's color object to the channels {@link serializeColor} works in. */
const toRgba = (color: AggregationColor): Rgba => {
  const { r, g, b, a } = color.toRgb();
  return { r, g, b, a: typeof a === 'number' ? a : 1 };
};

/**
 * One field rather than three widgets in a row: the swatch is the input's
 * prefix, the color stays editable as text, and antd's own allowClear provides
 * the clear affordance - so it reads like any other antd input.
 *
 * Three things the widget layout has to serve, all from section 18 and
 * Adjustment 8:
 *
 * - **Text and picker share one storage contract.** Whatever either produces is
 *   written in `colorSaveFormat`, and neither rewrites a value the user has not
 *   edited. Typed text is committed as typed and normalized on blur, so
 *   `#ff0` does not turn into `rgb(255, 255, 0)` between two keystrokes and
 *   move the caret.
 * - **The picker can clear.** `allowClear` puts the clear affordance inside the
 *   panel, which is the only affordance there is when text entry is off.
 * - **An unparseable value stays visible.** It is left in the data for the
 *   validator to report rather than being replaced by the picker's fallback
 *   black.
 */
export const AntdColorControl = (props: ControlProps) => {
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
  const value = typeof props.data === 'string' ? props.data : undefined;
  // Set when an edit was refused rather than committed - currently only
  // `hex3` + transparency, which the specification says must not be quietly
  // flattened to an opaque color.
  const [refused, setRefused] = useState(false);
  // Which channel set the panel is showing. Controlled rather than left to
  // antd, so that every opening starts on the format the value is stored in.
  const [panelFormat, setPanelFormat] = useState<ColorFormatType>();
  // hooks run before the visibility guard
  const { allowClear, affordanceProps } = useClearAffordance(Boolean(value));

  const options = props.uischema.options;
  // `placeholder`, `focus` and `clearable` are the shared control options the
  // specification lists for this renderer; they are upstream conventions, so
  // they stay flat and are read from the merged element/config view rather
  // than from the `jsonformsExtended` namespace.
  const shared = { ...props.config, ...options } as Record<string, unknown>;
  const clearable = shared.clearable !== false;
  const saveFormat = asColorSaveFormat(
    resolveExtendedOption(
      options,
      props.config,
      'colorSaveFormat',
      DEFAULT_COLOR_SAVE_FORMAT
    )
  );
  const textEntry =
    resolveExtendedOption<boolean>(
      options,
      props.config,
      'colorTextEntry',
      true
    ) !== false;

  if (!props.visible) return null;

  const commit = (next?: string) => {
    setRefused(false);
    props.handleChange(props.path, next || undefined);
  };

  /** Serializes an edit, or refuses it when the format cannot carry it. */
  const commitColor = (color: AggregationColor) => {
    if (color.cleared) {
      commit(undefined);
      return;
    }
    const next = serializeColor(toRgba(color), saveFormat);
    if (next === undefined) {
      setRefused(true);
      return;
    }
    commit(next);
  };

  /**
   * Rewrites a typed color into the configured representation once the user
   * leaves the field. Text that does not parse is left exactly as typed: it is
   * the validator's job to explain it, not this control's job to guess.
   */
  const normalize = () => {
    const parsed = parseColor(value);
    if (!parsed) return;
    const next = serializeColor(parsed, saveFormat);
    if (next === undefined) {
      // A transparent value under `hex3`. Rejected without committing an
      // opaque replacement, per section 18.
      setRefused(true);
      return;
    }
    setRefused(false);
    if (next !== value) {
      props.handleChange(props.path, next);
    }
  };

  const guidance = refused ? t('color.hex3Transparency') : undefined;
  const cssColor = toCssColor(value);

  const swatch = (size: number) => (
    <span
      style={{
        display: 'block',
        width: size,
        height: size,
        borderRadius: token.borderRadiusSM,
        border: `1px solid ${token.colorBorder}`,
        background: cssColor ?? 'transparent',
        cursor: props.enabled ? 'pointer' : 'not-allowed',
      }}
    />
  );

  const savedPanelFormat = pickerFormatFor(saveFormat);

  const picker = (children: React.ReactNode) => (
    <ColorPicker
      disabled={!props.enabled}
      // Never the stored text: `hsb(...)` is not CSS, and handing it to the
      // picker would parse as black. An unrecognized value opens the panel
      // empty rather than pretending to be a color.
      value={cssColor ?? null}
      /*
        Controlled, and reset on every open, so the panel always starts on the
        channels the value is actually stored in - `rgb` for an rgb-saving
        field, `hsb` for an hsb-saving one. `defaultFormat` only seeds the
        first render, so a field left on another tab reopened on that tab and
        showed numbers in a model it does not store. Switching tabs while the
        panel is open still works; it changes what is being edited, never what
        is written.
      */
      format={panelFormat ?? savedPanelFormat}
      onFormatChange={setPanelFormat}
      onOpenChange={(open) => {
        if (open) setPanelFormat(savedPanelFormat);
      }}
      allowClear={clearable}
      onClear={() => commit(undefined)}
      onChangeComplete={commitColor}
    >
      {children}
    </ColorPicker>
  );

  return (
    <ControlFormItem
      id={props.id}
      label={props.label}
      required={props.required}
      errors={filteredErrors || undefined}
      help={
        filteredErrors ||
        (guidance ? (
          <span role='alert' data-color-guidance>
            {guidance}
          </span>
        ) : (
          props.description
        ))
      }
    >
      {textEntry ? (
        <Input
          allowClear={clearable && allowClear}
          {...affordanceProps}
          onBlur={() => {
            affordanceProps.onBlur();
            onBlurTouch();
            normalize();
          }}
          // lineHeight 0 stops the prefix span from inheriting the text line box
          styles={{
            prefix: { lineHeight: 0, display: 'flex', alignItems: 'center' },
          }}
          disabled={!props.enabled}
          // An authored hint wins; otherwise the hint is the syntax of the
          // configured representation, which section 18 requires it to reflect.
          placeholder={
            (shared.placeholder as string | undefined) ??
            t(placeholderKeyFor(saveFormat))
          }
          autoFocus={shared.focus === true}
          status={filteredErrors ? 'error' : refused ? 'warning' : undefined}
          value={value ?? ''}
          onChange={(event) => commit(event.currentTarget.value)}
          prefix={picker(
            /*
              A custom trigger rather than antd's default one: that trigger
              carries its own border, padding and min-height, which makes it
              taller than the input's text line and sit off-centre in a prefix.
              A plain swatch can be sized to the line box instead.
            */
            <span role='button' aria-label={t('editor.chooseColor')}>
              {swatch(14)}
            </span>
          )}
        />
      ) : (
        /*
          `colorTextEntry: false`. The value is not typeable, so the picker is
          the whole control - but the trigger is a real button, because
          removing text entry must not remove keyboard access. The stored text
          is shown verbatim beside the swatch rather than through antd's
          `showText`, which would render the picker's interpretation of the
          value and so display `#000000` for anything it failed to parse.
        */
        picker(
          <button
            type='button'
            disabled={!props.enabled}
            aria-label={t('editor.chooseColor')}
            autoFocus={shared.focus === true}
            data-color-trigger
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: token.paddingXS,
              padding: `${token.paddingXXS}px ${token.paddingXS}px`,
              borderRadius: token.borderRadius,
              border: `1px solid ${
                filteredErrors ? token.colorError : token.colorBorder
              }`,
              background: token.colorBgContainer,
              color: token.colorText,
              font: 'inherit',
              cursor: props.enabled ? 'pointer' : 'not-allowed',
            }}
          >
            {swatch(16)}
            <span>{value ?? ''}</span>
          </button>
        )
      )}
    </ControlFormItem>
  );
};

export const AntdColorControlRenderer =
  withJsonFormsControlProps(AntdColorControl);
