import React from 'react';
import {
  JsonSchema,
  Generate,
  OwnPropsOfControl,
  getI18nKey,
  ControlProps,
  CombinatorRendererProps,
  UISchemaElement,
  and,
  rankWith,
  optionIs,
  isEnumControl,
  isOneOfControl,
  or,
  createCombinatorRenderInfos,
  createDefaultValue,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  ctxToControlProps,
  useJsonForms,
  withJsonFormsControlProps,
  withJsonFormsOneOfProps,
} from '@jsonforms/react';
import isEqual from 'lodash/isEqual';
import { resolveConfirmationPolicy } from './confirmation';
import { branchChangeData, discardedByBranchChange } from './combinators';

export interface CardChoice {
  value?: unknown;
  branch?: number;
  label?: string;
  i18n?: string;
  disabled?: boolean;
  content?: UISchemaElement;
  selectedContent?: UISchemaElement;
  detail?: UISchemaElement;
}

export const choiceCardsTester = rankWith(
  21,
  and(optionIs('format', 'cards'), or(isEnumControl, isOneOfControl))
);

// Keep interactive controls and arbitrary templates out of a radio's label.
export const isCardPresentation = (element: any): boolean =>
  !!element &&
  (['Label', 'ImageView'].includes(element.type) ||
    (['VerticalLayout', 'HorizontalLayout'].includes(element.type) &&
      Array.isArray(element.elements) &&
      element.elements.every(isCardPresentation)));

type Confirmation = () => {
  request: (request: {
    operation: 'branchChange';
    catalogId: 'oneOf';
    discarded: unknown[];
    options?: Record<string, unknown>;
    config?: unknown;
    perform: () => void;
  }) => void;
  dialog: React.ReactNode;
};

export interface ChoiceCardColors {
  border: string;
  selected: string;
  focus: string;
  background: string;
  error: string;
}

export const createChoiceCards = (
  useConfirmation: Confirmation,
  useColors: () => ChoiceCardColors
) => {
  const Cards = (props: ControlProps & Partial<CombinatorRendererProps>) => {
    const {
      schema,
      uischema,
      data,
      path,
      enabled,
      visible,
      handleChange,
      renderers,
      cells,
      label,
      errors,
    } = props;
    const ctx = useJsonForms();
    const translate =
      ctx.i18n?.translate ?? ((_key: string, fallback?: string) => fallback);
    const confirmation = useConfirmation();
    const colors = useColors();
    const groupId = React.useId();
    const pointerFocus = React.useRef(false);
    const [focusedCard, setFocusedCard] = React.useState<number>();
    const showRadio = uischema.options?.showRadio === true;
    const branches = schema.oneOf as JsonSchema[] | undefined;
    const constants = branches?.every((branch) =>
      Object.prototype.hasOwnProperty.call(branch, 'const')
    );
    const branchMode = !schema.enum && !!branches && !constants;
    const values =
      schema.enum ?? (constants ? branches!.map((branch) => branch.const) : []);
    const [chosen, setChosen] = React.useState<number | undefined>();
    const selected = branchMode
      ? chosen ?? props.indexOfFittingSchema ?? -1
      : values.findIndex((value) => isEqual(value, data));
    const infos = branchMode
      ? createCombinatorRenderInfos(
          branches!,
          props.rootSchema!,
          'oneOf',
          uischema,
          path,
          props.uischemas
        )
      : [];
    const custom: CardChoice[] = uischema.options?.choices ?? [];
    const choices = (branchMode ? branches! : values).map((_, index) => {
      const choice =
        custom.find((item) =>
          branchMode
            ? item.branch === index
            : Object.prototype.hasOwnProperty.call(item, 'value') &&
              isEqual(item.value, values[index])
        ) ?? {};
      const fallback =
        choice.label ??
        branches?.[index]?.title ??
        (branchMode ? infos[index].label : String(values[index]));
      return {
        ...choice,
        label: choice.i18n
          ? translate(`${choice.i18n}.label`, fallback) ?? fallback
          : translate(
              getI18nKey(schema, uischema, path, `choices.${index}.label`),
              fallback
            ) ?? fallback,
      };
    });
    const select = (index: number) => {
      if (!enabled || choices[index].disabled || index === selected) return;
      if (!branchMode) {
        handleChange(path, values[index]);
        return;
      }
      confirmation.request({
        operation: 'branchChange',
        catalogId: 'oneOf',
        discarded: [
          discardedByBranchChange(
            data,
            schema,
            resolveConfirmationPolicy({
              options: uischema.options,
              config: props.config,
              catalogId: 'oneOf',
              operation: 'branchChange',
            }) === 'complex'
          ),
        ],
        options: uischema.options,
        config: props.config,
        perform: () => {
          setChosen(index);
          handleChange(
            path,
            branchChangeData(
              data,
              createDefaultValue(infos[index].schema, props.rootSchema!),
              schema
            )
          );
        },
      });
    };
    const enclosingSchema = { ...schema };
    delete enclosingSchema.oneOf;
    if (!visible) return null;
    return (
      <div className='jsonforms-choice-cards'>
        {branchMode && Object.keys(schema.properties ?? {}).length > 0 && (
          <JsonFormsDispatch
            schema={enclosingSchema}
            uischema={Generate.uiSchema(
              enclosingSchema,
              'VerticalLayout',
              undefined,
              props.rootSchema
            )}
            path={path}
            renderers={renderers}
            cells={cells}
            enabled={enabled}
          />
        )}
        <fieldset
          role='radiogroup'
          aria-required={props.required || undefined}
          disabled={!enabled}
          style={{ border: 0, padding: 0, margin: 0 }}
          aria-invalid={!!errors}
          aria-describedby={errors ? `${groupId}-errors` : undefined}
        >
          {label && (
            <legend>
              {label}
              {props.required && <span aria-hidden='true'> *</span>}
            </legend>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {choices.map((choice, index) => {
              const active = selected === index;
              const content = active
                ? choice.selectedContent ?? choice.content
                : choice.content ?? choice.selectedContent;
              return (
                <div
                  key={index}
                  onClick={(event) => {
                    const radio = event.currentTarget.querySelector('input');
                    if (radio && event.target !== radio && !radio.disabled) {
                      radio.focus();
                      radio.click();
                    }
                  }}
                  onPointerDown={() => {
                    pointerFocus.current = true;
                    setFocusedCard(undefined);
                  }}
                  onKeyDown={() => {
                    pointerFocus.current = false;
                    setFocusedCard(index);
                  }}
                  className='jsonforms-choice-card'
                  data-selected={active}
                  style={{
                    position: 'relative',
                    outline:
                      focusedCard === index
                        ? `2px solid ${colors.focus}`
                        : undefined,
                    outlineOffset: 3,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: 16,
                    background: colors.background,
                    boxShadow: active
                      ? `inset 0 0 0 1px ${colors.selected}`
                      : undefined,
                    border: `2px solid ${
                      errors
                        ? colors.error
                        : active
                        ? colors.selected
                        : colors.border
                    }`,
                    borderRadius: 8,
                    cursor: enabled && !choice.disabled ? 'pointer' : 'default',
                    opacity: !enabled || choice.disabled ? 0.5 : 1,
                  }}
                >
                  <input
                    type='radio'
                    onFocus={(event) => {
                      if (
                        !pointerFocus.current &&
                        event.currentTarget.matches(':focus-visible')
                      )
                        setFocusedCard(index);
                      pointerFocus.current = false;
                    }}
                    onBlur={() => setFocusedCard(undefined)}
                    style={
                      showRadio
                        ? undefined
                        : {
                            position: 'absolute',
                            width: 1,
                            height: 1,
                            padding: 0,
                            margin: -1,
                            overflow: 'hidden',
                            clipPath: 'inset(50%)',
                            whiteSpace: 'nowrap',
                            border: 0,
                          }
                    }
                    name={groupId}
                    aria-label={choice.label}
                    checked={active}
                    disabled={!enabled || choice.disabled}
                    onChange={() => select(index)}
                  />
                  <div
                    ref={(node) => node?.setAttribute('inert', '')}
                    style={{ pointerEvents: 'none', minWidth: 0 }}
                    aria-hidden='true'
                  >
                    {content && isCardPresentation(content) ? (
                      <JsonFormsDispatch
                        schema={schema}
                        uischema={content}
                        path={path}
                        renderers={renderers}
                        cells={cells}
                      />
                    ) : null}
                    <div>{choice.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>
        {props.description && <div>{props.description}</div>}
        {errors && (
          <div
            id={`${groupId}-errors`}
            role='alert'
            style={{ color: colors.error }}
          >
            {errors}
          </div>
        )}
        {branchMode && infos[selected] && (
          <div style={{ marginTop: 16 }}>
            <JsonFormsDispatch
              schema={infos[selected].schema}
              uischema={choices[selected].detail ?? infos[selected].uischema}
              path={path}
              renderers={renderers}
              cells={cells}
              enabled={enabled}
            />
          </div>
        )}
        {confirmation.dialog}
      </div>
    );
  };
  const BranchCards = withJsonFormsOneOfProps(Cards);
  const ValueCards = withJsonFormsControlProps(Cards);
  const ChoiceCards = (props: OwnPropsOfControl) => {
    const ctx = useJsonForms();
    const resolved = ctxToControlProps(ctx, props).schema;
    return !resolved.enum &&
      resolved.oneOf &&
      !(resolved.oneOf as JsonSchema[]).every((branch) =>
        Object.prototype.hasOwnProperty.call(branch, 'const')
      ) ? (
      <BranchCards {...props} />
    ) : (
      <ValueCards {...props} />
    );
  };
  return ChoiceCards;
};
