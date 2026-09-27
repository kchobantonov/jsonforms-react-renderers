import {
  BaseUISchemaElement,
  LayoutProps,
  RankedTester,
  UISchemaElement,
  deriveLabelForUISchemaElement,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import {
  TranslateProps,
  useJsonForms,
  withJsonFormsLayoutProps,
  withTranslateProps,
} from '@jsonforms/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHandleAction, type ActionEvent } from './actionContext';
import { allowsScriptEvaluation } from '../util/templateLang';

/**
 * `Button` - invoking a command, as opposed to `Link`, which navigates.
 *
 * Section 14 puts `label`, `icon`, `color`, `params`, `action` and `script`
 * at the **top level** of the element. `options` is still read underneath
 * them, because forms in this repository were authored that way.
 *
 * `action` and `script` are mutually exclusive. The action path hands an
 * `ActionEvent` to the host and awaits it; the script path runs a string
 * directly and is gated on the script-evaluation permission.
 */

export type ButtonSemanticColor =
  | 'primary'
  | 'secondary'
  | 'alternative'
  | 'success'
  | 'warning'
  | 'error';

/**
 * A `script` written in TypeScript rather than serialized.
 *
 * The event arrives as the **first argument**. `this` is bound to it as well,
 * so a body pasted across from the string form keeps working - but an
 * argument is the idiom, because `.call()` cannot bind an arrow function's
 * `this` and an arrow is what anyone writes by reflex:
 *
 * ```ts
 * script: (event) => console.log(event.context)          // works
 * script: function () { console.log(this.context); }     // also works
 * script: () => console.log(this.context)                // `this` is undefined
 * ```
 *
 * Section 14 places function-valued scripts outside the portable model, so
 * this is a build-time authoring convenience and never appears on the wire.
 */
export type ButtonScript =
  | string
  | ((this: ActionEvent, event: ActionEvent) => void | Promise<void>);

/*
  Built on `BaseUISchemaElement`, **not** `UISchemaElement`.

  In this core version `UISchemaElement` is a *union* of nine types, so
  intersecting it distributes across all of them - the XOR below would become
  twenty-seven members, TypeScript would report a mismatch against whichever
  it tried last (`HorizontalLayout`, typically), and an author would be told
  their Button was missing `elements`. `BaseUISchemaElement` is the single
  interface those nine share, and a Button is assignable to `UISchemaElement`
  through it either way.

  The literal `type: 'Button'` is the discriminant that lets TypeScript pick
  the right member and say something useful when it cannot.
*/
export type ButtonUiSchemaBase = BaseUISchemaElement & {
  type: 'Button';
  label?: string;
  text?: string;
  name?: string;
  icon?: string;
  color?: ButtonSemanticColor;
  params?: Record<string, unknown>;
  options?: {
    action?: string;
    label?: string;
    text?: string;
    disabled?: boolean;
    [key: string]: any;
  };
};

/**
 * `action` and `script` are **mutually exclusive**, and the type says so.
 *
 * Section 14 states the exclusivity without saying which wins, because an
 * element carrying both is an authoring mistake. The `never` members make it
 * one TypeScript refuses to compile; the runtime still has to cope, because
 * JSON-authored forms never pass through this type.
 */
export type ButtonUiSchema =
  | (ButtonUiSchemaBase & { action: string; script?: never })
  | (ButtonUiSchemaBase & { script: ButtonScript; action?: never })
  | (ButtonUiSchemaBase & { action?: never; script?: never });

export type ButtonRendererComponentProps = LayoutProps &
  TranslateProps & {
    uischema: ButtonUiSchema;
  };

export type ButtonRendererOptions = {
  ButtonComponent?: React.ComponentType<any>;
  buttonProps?: Record<string, any>;
  getButtonProps?: (
    props: ButtonRendererComponentProps & {
      pending: boolean;
      color?: ButtonSemanticColor;
      icon?: string;
    }
  ) => Record<string, any>;
};

/**
 * Builds and runs a `script`.
 *
 * Section 14: "`script` is a string containing an async function body, with
 * top-level await supported. Invoke it with the ActionEvent as `this`,
 * equivalent to `await new AsyncFunction(script).call(source)`."
 */
const runScript = async (
  script: ButtonScript,
  source: ActionEvent
): Promise<void> => {
  if (typeof script === 'function') {
    /*
      Bound **and** passed. `.call()` cannot bind an arrow function's `this` -
      it is lexical - so a `() => this.context` compiles, runs and quietly
      reads the wrong thing. Handing the event as an argument as well means
      neither idiom can be got wrong, at the cost of one word.
    */
    await script.call(source, source);
    return;
  }
  const AsyncFunction = Object.getPrototypeOf(async function () {
    /* the async function constructor is not a global */
  }).constructor;
  await new AsyncFunction(script).call(source);
};

export const buttonRendererTester: RankedTester = rankWith(
  2,
  uiTypeIs('Button')
);

const DIAGNOSTIC_STYLE: React.CSSProperties = {
  border: '1px solid currentColor',
  borderRadius: 4,
  padding: '0.5rem 0.75rem',
  opacity: 0.85,
  fontSize: '0.85rem',
};

export const createButtonRenderer = ({
  ButtonComponent = 'button' as any,
  buttonProps = {},
  getButtonProps,
}: ButtonRendererOptions = {}) => {
  const ButtonRenderer = (props: ButtonRendererComponentProps) => {
    const { enabled, uischema, visible, config, t } = props;
    const handleAction = useHandleAction();
    const ctx = useJsonForms();

    /*
      "Pending/loading covers the complete fireActionEvent promise. Duplicate
      activation SHOULD be prevented while pending." The ref is what actually
      prevents the second activation: a second click can arrive before React
      has re-rendered with the new state.
    */
    const [pending, setPending] = useState(false);
    const running = useRef(false);

    const element = uischema;
    const label =
      deriveLabelForUISchemaElement(element as any, t) ??
      element.options?.label ??
      element.options?.text ??
      element.label ??
      element.text ??
      element.name ??
      'Action';
    /*
      Deliberately **not** falling back to the label. The label is translated,
      so an action derived from it would change with the form's language - a
      host answering `setLocale` in English would stop recognising the command
      once the form was in Bulgarian. `name` is stable and is kept.
    */
    const action = element.action ?? element.options?.action ?? element.name;
    const script = element.script;
    // "Missing optional Button params are normalized to `{}` when
    // constructing ActionEvent", so a host can read `event.params.x` without
    // guarding every access.
    const params = element.params ?? {};

    const activate = useCallback(async () => {
      if (running.current) {
        return;
      }
      running.current = true;
      setPending(true);
      const event = {
        action: action ?? '',
        label,
        params,
        element: element as UISchemaElement,
        context: ctx,
      };
      try {
        /*
          **Action first.** Section 14 states the exclusivity without saying
          which wins, so the question is which failure is least harmful when a
          form carries both - and the answer is the one the host can see.

          An action goes to the application's handler, where it can be logged,
          refused or authorised. A script runs arbitrary code with no such
          oversight, and the specification calls it "a last-resort,
          non-portable runtime escape hatch". Preferring the portable,
          auditable path is the same choice this project makes everywhere
          else. It also happens to be the only one available when a JSON form
          carries a string script and the host has not granted
          `allowScriptEvaluation`.
        */
        if (script !== undefined && action === undefined) {
          await runScript(script, event);
        } else {
          // Also the path for a button declaring neither, which fires an
          // event with an empty action rather than being a dead control.
          await handleAction?.(event);
        }
      } finally {
        // "Rejection clears pending and propagates through existing
        // application/platform error handling" - so the reset is in `finally`
        // and the rejection is not swallowed.
        running.current = false;
        setPending(false);
      }
    }, [action, label, params, script, element, handleAction, ctx]);

    /*
      Both present is an authoring mistake that the XOR type makes impossible
      in TypeScript and cannot prevent in JSON. A warning rather than a
      rendered message: replacing the button would break a form that works
      today the moment somebody adds a stray `action`, and the person filling
      it in can do nothing about either.
    */
    useEffect(() => {
      if (element.action !== undefined && element.script !== undefined) {
        // eslint-disable-next-line no-console
        console.warn(
          `action.conflict: ${JSON.stringify(
            label
          )} declares both an action and a script, which are mutually exclusive. The action is used.`
        );
      }
    }, [element.action, element.script, label]);

    if (!visible) {
      return null;
    }

    /*
      "String evaluation requires allowScriptEvaluation=true… the renderer
      MUST NOT weaken CSP and MUST report unsupported/evaluation-disabled
      behavior instead." A script button that silently did nothing would look
      like a broken command rather than a policy decision.
    */
    /*
      The gate is on **string** evaluation, which is what needs CSP
      `unsafe-eval`. A function the build already compiled needs no such
      permission, so requiring one would be theatre.
    */
    if (typeof script === 'string' && !allowsScriptEvaluation(config)) {
      return (
        <div
          role='alert'
          data-button-diagnostic='script.evaluationDisabled'
          style={DIAGNOSTIC_STYLE}
        >
          {`"${label}" runs a script, which compiles a string into executable code. ` +
            'That requires jsonformsExtended.security.allowScriptEvaluation to be true.'}
        </div>
      );
    }

    const disabled = !enabled || element.options?.disabled === true || pending;
    const mappedProps = getButtonProps?.({
      ...props,
      pending,
      color: element.color,
      icon: element.icon,
    });

    return (
      <ButtonComponent
        type='button'
        {...buttonProps}
        {...mappedProps}
        disabled={disabled}
        aria-busy={pending || undefined}
        data-button-pending={pending || undefined}
        onClick={activate}
      >
        {label}
      </ButtonComponent>
    );
  };

  return withJsonFormsLayoutProps(
    withTranslateProps(ButtonRenderer as any) as any
  );
};

export const ButtonRenderer = createButtonRenderer();
