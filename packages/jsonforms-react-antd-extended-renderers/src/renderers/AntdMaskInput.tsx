import { CellProps, WithClassname } from '@jsonforms/core';
import { AntdClearableInput } from '@chobantonov/jsonforms-react-antd-renderers';
import { Input } from 'antd';
import type { InputRef } from 'antd';
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createMask,
  displayValue,
  maskEdit,
  nextCaret,
  resolveMaskSettings,
  storedValue,
  withinMaxLength,
} from '../util/maskFormat';

const reportedMasks = new Set<string>();

/**
 * An authored token whose regex does not compile. Warned once per token so a
 * re-render storm cannot fill the console, and never thrown: one bad token
 * must not blank the form it appears in.
 */
const warnInvalidToken = (token: string, pattern: string) => {
  const key = `${token}:${pattern}`;
  if (reportedMasks.has(key)) {
    return;
  }
  reportedMasks.add(key);
  // eslint-disable-next-line no-console
  console.warn(
    `Mask token '${token}' has an invalid pattern and was ignored: ${pattern}`
  );
};

/**
 * The masked text field.
 *
 * Written in the shape of a cell rather than as a whole control, so the frame
 * comes from `InputControl` like every other antd input - label, description,
 * required marker and error message included. It is registered as a renderer
 * only; see Adjustment 11.10 for why there is no masked table cell.
 *
 * Three decisions are worth reading before changing anything here.
 *
 * **The engine is driven by hand, not through maska's `MaskInput`.** That class
 * assigns `input.value` directly and announces the result with a
 * `CustomEvent('input')`. React tracks a controlled input's value through a
 * patched `value` setter, so the assignment updates React's tracker and the
 * synthetic `onChange` that would follow is suppressed; the CustomEvent does
 * not bubble, so React's root listener never sees it either. The binding would
 * silently stop reporting edits. `MaskInput` also normalizes the field's value
 * in a microtask after it attaches, which is exactly the mount-time rewrite the
 * specification forbids. Only the pure `Mask` is used, and the binding is here.
 *
 * **Edits commit immediately.** The text control debounces by 300ms; this one
 * does not, because the displayed text and the stored value are two different
 * strings and keeping a third, in-flight one would mean the field could not
 * tell a draft from data the host had replaced underneath it. Committing in
 * step makes the rule below exact, and leaves nothing for a detail dialog's
 * Apply to flush.
 *
 * **The draft is only trusted while it still means the stored value.** There is
 * no effect synchronizing state to props: the typed text is used when it still
 * round-trips to what is in the data, and otherwise the display is derived from
 * the data. An external replacement therefore wins automatically, which is what
 * the pending-edit contract asks for - "data replacement policy must not
 * silently let an outdated draft overwrite the replacement."
 */
export const AntdMaskInput = React.memo(function AntdMaskInput(
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

  /*
    The shared control options - `clearable`, `focus`, `placeholder`,
    `restrict` - are upstream conventions, so they stay flat and come from the
    merged config/element view. The mask's own options are project extensions
    and are resolved through the `jsonformsExtended` namespace instead; see
    Adjustment 1.
  */
  const appliedUiSchemaOptions = {
    ...(config as Record<string, unknown> | undefined),
    ...uischema.options,
  } as Record<string, any>;
  const settings = useMemo(
    () => resolveMaskSettings(uischema.options, config, warnInvalidToken),
    [uischema.options, config]
  );
  const mask = useMemo(
    () => (settings ? createMask(settings) : undefined),
    [settings]
  );

  /*
    The real `<input>`, reached through antd's ref rather than through the
    event.

    rc-input hands `onChange` a **clone** of the input node - `resolveOnChange`
    in `@rc-component/input` rebuilds the event with `target.cloneNode(true)`
    whenever it has a value to force - so `event.currentTarget` is a detached
    element. Writing the masked text to it changes nothing on screen, and React
    then finds the real node still holding what was typed, assigns `value`
    itself, and the browser moves the caret to the end. That is the whole of the
    caret bug this ref exists to avoid; the clone forwards `setSelectionRange`
    to the original, which is what made the symptom look intermittent - a caret
    set before React's write survived only when it was already at the end.
  */
  const inputRef = useRef<InputRef>(null);
  const pendingCaret = useRef<number | undefined>(undefined);
  const [draft, setDraft] = useState<string | undefined>(undefined);
  // Set while an input-method editor is composing. The specification is
  // explicit that a mask "must not overwrite the active draft or prematurely
  // treat it as a finalized value", so nothing is masked until composition ends
  // - otherwise the intermediate romaji of a Japanese entry would be filtered
  // away character by character and the word could never be typed.
  const composing = useRef(false);

  const stored = typeof data === 'string' ? data : '';
  const returnMaskedValue = settings?.returnMaskedValue === true;

  const display = useMemo(() => {
    if (!mask) {
      return stored;
    }
    if (
      draft !== undefined &&
      storedValue(mask, draft, returnMaskedValue) === stored
    ) {
      return draft;
    }
    return displayValue(mask, stored, returnMaskedValue);
  }, [draft, mask, returnMaskedValue, stored]);

  const commit = useCallback(
    (next: string) => {
      setDraft(next);
      if (!mask) {
        handleChange(path, next || undefined);
        return;
      }
      handleChange(
        path,
        storedValue(mask, next, returnMaskedValue) || undefined
      );
    },
    [handleChange, mask, path, returnMaskedValue]
  );

  const onClear = useCallback(() => {
    setDraft(undefined);
    handleChange(path, undefined);
  }, [handleChange, path]);

  /**
   * Puts the caret back once React has written the masked text.
   *
   * It has to be after the commit, not inside the change handler: React
   * assigns `value` to the real node during its own commit, and assigning
   * `value` moves the text entry cursor to the end whatever it held before.
   * The guard on `field.value` keeps a stale position from being applied to
   * text that has moved on since.
   */
  useLayoutEffect(() => {
    const position = pendingCaret.current;
    if (position === undefined) {
      return;
    }
    pendingCaret.current = undefined;
    const field = inputRef.current?.input;
    if (field && field.value === display) {
      field.setSelectionRange(position, position);
    }
  });

  const onChange = useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      // The real node, never the event's - see `inputRef`. Its value is still
      // the text as typed at this point, because React has not committed yet.
      const field = inputRef.current?.input;
      const raw = field ? field.value : event.currentTarget.value;
      if (!mask || composing.current) {
        commit(raw);
        return;
      }
      const deleting = (
        (event.nativeEvent as InputEvent).inputType ?? ''
      ).startsWith('delete');
      const caret = field ? field.selectionStart : null;
      const masked = maskEdit(mask, raw, deleting);

      // `restrict` limits the **stored** string, so this is the only place the
      // limit can be applied: the displayed text is a different length and the
      // input's own `maxlength` would count the wrong characters.
      if (
        appliedUiSchemaOptions.restrict &&
        !withinMaxLength(
          storedValue(mask, masked, returnMaskedValue),
          schema.maxLength
        )
      ) {
        // Refused, so no state changes and React will not re-render - which
        // would leave the rejected keystroke sitting in the DOM. Put the
        // accepted text back by hand, with the caret where the refused
        // character would have gone.
        if (field) {
          field.value = display;
          const restore = Math.max(0, (caret ?? display.length) - 1);
          field.setSelectionRange(restore, restore);
        }
        return;
      }

      pendingCaret.current = nextCaret(mask, raw, caret, masked, deleting);
      commit(masked);
    },
    [
      appliedUiSchemaOptions.restrict,
      commit,
      display,
      mask,
      returnMaskedValue,
      schema.maxLength,
    ]
  );

  return (
    <AntdClearableInput
      clearable={appliedUiSchemaOptions.clearable !== false}
      data={data}
      enabled={enabled}
      onClear={onClear}
    >
      <Input
        ref={inputRef}
        value={display}
        onChange={onChange}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={(event) => {
          composing.current = false;
          // The composed text was let through unmasked, so mask it now the
          // session is over rather than waiting for the next keystroke.
          onChange(event);
        }}
        className={className}
        id={id}
        disabled={!enabled}
        autoFocus={appliedUiSchemaOptions.focus}
        style={{ width: '100%' }}
        /*
          The mask is the fallback hint, which is the convention in the
          neighbouring Vuetify family and which the specification permits so
          long as a renderer says which it does: `###-###` shows the shape of
          the field without claiming to be a real value. An explicit empty
          placeholder suppresses it, as section 18 requires.
        */
        placeholder={
          appliedUiSchemaOptions.placeholder ??
          (typeof settings?.mask === 'string' ? settings.mask : undefined)
        }
        data-mask-input
        {...inputProps}
      />
    </AntdClearableInput>
  );
});
