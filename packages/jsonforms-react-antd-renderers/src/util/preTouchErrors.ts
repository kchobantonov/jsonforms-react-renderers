import {
  ControlElement,
  JsonSchema,
  getCombinedErrorMessage,
  getControlPath,
} from '@jsonforms/core';
import type { ErrorObject } from 'ajv';
import { useCallback, useMemo, useState } from 'react';
import { useJsonForms } from '@jsonforms/react';
import merge from 'lodash/merge';

/**
 * Pre-touch error-message filtering.
 *
 * A form opened on incomplete data greets the user with a required error on
 * every field they have not reached yet. These two options hide those messages
 * until the user has actually visited the field:
 *
 * - `enableFilterErrorsBeforeTouch` - false when absent; true turns filtering on.
 * - `filterErrorKeywordsBeforeTouch` - the keywords to suppress. Absent or
 *   empty, with filtering on, suppresses **all** of a control's error text
 *   before touch.
 *
 * Both are renderer options with global config defaults that a control's own
 * `options` override, in either direction.
 *
 * **Presentation only.** The form's validity, the structured errors, and the
 * data are all untouched; this decides what one control prints. It cannot make
 * an error appear either - a control whose errors the validation mode already
 * hides stays quiet when filtering is switched off.
 *
 * The algorithm is the one the Vuetify (`vue-vuetify/src/util/composition.ts`)
 * and Svelte renderer families already use, deliberately: these are their
 * option names, so a form authored against them has to behave the same here.
 */

export interface FilterErrorsBeforeTouchInput {
  /** Whether this control has been blurred at least once. */
  touched: boolean;
  /** The control's formatted errors, as JSON Forms computed them. */
  errors: string;
  /** `config` merged with the element's `options`. */
  appliedOptions: Record<string, any>;
  /** Every error in the form, from `core`. */
  coreErrors: ErrorObject[] | undefined;
  path: string;
  schema?: JsonSchema;
  uischema?: ControlElement;
  translate?: (key: string, defaultMessage?: string, context?: any) => string;
  translateError?: (
    error: ErrorObject,
    translate: any,
    uischema?: any
  ) => string;
}

/**
 * The filtered message for one control.
 *
 * Returns `errors` unchanged whenever filtering does not apply, so a control
 * that opts out - or one nobody configured - pays nothing and cannot have its
 * text rewritten by a formatting difference.
 */
export const filterErrorsBeforeTouch = ({
  touched,
  errors,
  appliedOptions,
  coreErrors,
  path,
  schema,
  uischema,
  translate,
  translateError,
}: FilterErrorsBeforeTouchInput): string => {
  if (touched || !errors || !appliedOptions.enableFilterErrorsBeforeTouch) {
    return errors;
  }

  const filterKeywords = appliedOptions.filterErrorKeywordsBeforeTouch;

  if (Array.isArray(filterKeywords) && filterKeywords.length > 0) {
    /*
      Granular filtering needs the keyword, which the formatted `errors` string
      no longer carries - so the structured errors are read back from core and
      narrowed to this control. `getControlPath` is what maps an Ajv
      `instancePath` onto a JSON Forms path, including for `additionalErrors`
      a host published.
    */
    const errorsAtControl = (coreErrors ?? []).filter(
      (error) => path === getControlPath(error)
    );

    const errorsToShow = errorsAtControl.filter(
      (error) => !error.keyword || !filterKeywords.includes(error.keyword)
    );

    /*
      Nothing matched, so nothing is hidden - and the original string is
      returned rather than a recomposed one. Recomposing would be a no-op in
      the ordinary case and a silent difference wherever the control's own
      props carry more than core's errors do.
    */
    if (errorsToShow.length === errorsAtControl.length) {
      return errors;
    }

    if (!translateError) {
      return errors;
    }

    return getCombinedErrorMessage(
      errorsToShow,
      translateError,
      translate,
      schema,
      uischema,
      path
    );
  }

  // "an absent or empty array suppresses all otherwise displayable control
  // error text before touch"
  return '';
};

export interface PreTouchErrorsProps {
  errors?: string;
  path: string;
  schema?: JsonSchema;
  uischema?: ControlElement;
  config?: any;
}

export interface PreTouchErrors {
  /** What the control should print: `errors`, a subset of it, or nothing. */
  errors: string;
  focused: boolean;
  touched: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * `useFocus` plus the touch state the filter needs.
 *
 * Touch is per control and local, as it is in both reference implementations -
 * there is no shared registry, because nothing outside a control needs to know
 * that it was visited.
 *
 * **Touch is blur, not focus.** "The control becomes touched on blur:
 * receiving focus alone is insufficient, and leaving the control counts even
 * if the user did not change its data." It is also one-way: editing the value,
 * clearing it, or its becoming valid again does not untouch the control.
 */
export const usePreTouchErrors = (
  props: PreTouchErrorsProps
): PreTouchErrors => {
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const ctx = useJsonForms();

  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => {
    setTouched(true);
    setFocused(false);
  }, []);

  const appliedOptions = useMemo(
    () => merge({}, props.config ?? {}, props.uischema?.options ?? {}),
    [props.config, props.uischema]
  );

  const errors = filterErrorsBeforeTouch({
    touched,
    errors: props.errors ?? '',
    appliedOptions,
    coreErrors: ctx.core?.errors as ErrorObject[] | undefined,
    path: props.path,
    schema: props.schema,
    uischema: props.uischema,
    translate: ctx.i18n?.translate as any,
    translateError: ctx.i18n?.translateError as any,
  });

  return { errors, focused, touched, onFocus, onBlur };
};
