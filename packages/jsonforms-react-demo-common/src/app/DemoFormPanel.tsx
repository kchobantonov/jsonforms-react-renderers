import React from 'react';
import type { JsonFormsInitStateProps } from '@jsonforms/react';
import type { JsonFormsI18nState, ValidationMode } from '@jsonforms/core';
import {
  ActionEvent,
  AdditionalErrorStore,
  ExtendedJsonForms,
} from '@chobantonov/jsonforms-react-extended-renderers';
import type { DemoMode } from '../demoPreferences';
import type { DemoWrapperProps } from './types';
import { WebComponentHost } from './WebComponentHost';

/**
 * The form itself - the one part of the demo that is JSON Forms.
 *
 * Two ways to render it, and the point of having both is that they must agree:
 * as React through `ExtendedJsonForms`, or as the published web component. A
 * difference between the two panes is a defect in the element, not in the
 * demo.
 *
 * `ExtendedJsonForms` rather than `JsonForms`: it installs the additional-error
 * store - the middleware and the provider, which are only useful together - and
 * provides the action handler. A bare `JsonForms` would leave the Monaco
 * control's `propagateErrors` publishing into nothing and every `Button` a
 * no-op.
 */
export interface DemoFormPanelProps {
  /** Everything JSON Forms itself needs, already assembled. */
  jsonFormsProps: JsonFormsInitStateProps;
  /** Remounts the form when the example changes. */
  formKey: number;
  ajv: unknown;
  errorStore: AdditionalErrorStore;
  onAction: (event: ActionEvent) => void | Promise<void>;
  setData: (data: unknown) => void;
  setErrors: (errors: unknown[]) => void;
  /** A renderer family's own provider - antd's ConfigProvider, here. */
  Wrapper?: React.ComponentType<DemoWrapperProps>;
  webComponentTag?: string;
  useWebComponent: boolean;
  dark: boolean;
  mode: DemoMode;
  rtl: boolean;
  locale: string;
  validationMode: ValidationMode;
  rendererSettings: Record<string, unknown>;
  /**
   * Told what this render's locale and permission are.
   *
   * The validator is created once - Ajv caches compiled schemas - so it reads
   * both through getters, and this is where the cells they read get set.
   */
  onFormContext: (
    i18n: JsonFormsI18nState | undefined,
    allowScriptEvaluation: boolean
  ) => void;
}

export const DemoFormPanel = ({
  jsonFormsProps,
  formKey,
  ajv,
  errorStore,
  onAction,
  setData,
  setErrors,
  Wrapper,
  webComponentTag,
  useWebComponent,
  dark,
  mode,
  rtl,
  locale,
  validationMode,
  rendererSettings,
  onFormContext,
}: DemoFormPanelProps) => {
  if (webComponentTag && useWebComponent) {
    return (
      <WebComponentHost
        tagName={webComponentTag}
        props={jsonFormsProps}
        dark={dark}
        mode={mode}
        rtl={rtl}
        locale={locale}
        validationMode={validationMode}
        rendererSettings={rendererSettings}
        onChange={setData}
        onAction={onAction}
      />
    );
  }

  /*
    Immediately before rendering, so the validator's getters see this render's
    values rather than the previous one's.
  */
  onFormContext(
    jsonFormsProps.i18n as JsonFormsI18nState | undefined,
    (
      (jsonFormsProps.config as Record<string, any> | undefined)
        ?.jsonformsExtended?.security as Record<string, unknown> | undefined
    )?.allowScriptEvaluation === true
  );

  const content = (
    <ExtendedJsonForms
      key={formKey}
      ajv={ajv as never}
      store={errorStore}
      onAction={onAction}
      {...jsonFormsProps}
      onChange={({ data, errors: nextErrors }) => {
        setData(data);
        setErrors(nextErrors ?? []);
      }}
    />
  );

  return Wrapper ? (
    <Wrapper
      rendererSettings={rendererSettings}
      dark={dark}
      mode={mode}
      rtl={rtl}
      locale={locale}
    >
      {content}
    </Wrapper>
  ) : (
    content
  );
};
