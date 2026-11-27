import type { CellProps } from '@jsonforms/core';
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
} from './maskFormat';

const reportedMasks = new Set<string>();

const warnInvalidToken = (token: string, pattern: string) => {
  const key = `${token}:${pattern}`;
  if (reportedMasks.has(key)) {
    return;
  }
  reportedMasks.add(key);
  // oxlint-disable-next-line no-console
  console.warn(
    `Mask token '${token}' has an invalid pattern and was ignored: ${pattern}`,
  );
};

export function useMaskedInput(
  {
    data,
    config,
    uischema,
    path,
    handleChange,
    schema,
  }: Pick<
    CellProps,
    'data' | 'config' | 'uischema' | 'path' | 'handleChange' | 'schema'
  >,
  getInput: () => HTMLInputElement | null | undefined,
  compositionMode: 'defer' | 'commit',
) {
  const appliedUiSchemaOptions = {
    ...(config as Record<string, unknown> | undefined),
    ...uischema.options,
  } as Record<string, any>;
  const settings = useMemo(
    () => resolveMaskSettings(uischema.options, config, warnInvalidToken),
    [uischema.options, config],
  );
  const mask = useMemo(
    () => (settings ? createMask(settings) : undefined),
    [settings],
  );

  const pendingCaret = useRef<number | undefined>(undefined);
  const [draft, setDraft] = useState<string | undefined>(undefined);
  // Set while an input-method editor is composing. The specification is
  // explicit that a mask "must not overwrite the active draft or prematurely
  // treat it as a finalized value", so nothing is masked until composition ends
  // - otherwise the intermediate romaji of a Japanese entry would be filtered
  // away character by character and the word could never be typed.
  const [composing, setComposing] = useState(false);
  const composingRef = useRef(false);

  const stored = typeof data === 'string' ? data : '';
  const returnMaskedValue = settings?.returnMaskedValue === true;

  const display = useMemo(() => {
    if (compositionMode === 'defer' && composing && draft !== undefined)
      return draft;
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
  }, [compositionMode, composing, draft, mask, returnMaskedValue, stored]);

  const commit = useCallback(
    (next: string) => {
      setDraft(next);
      if (!mask) {
        handleChange(path, next || undefined);
        return;
      }
      handleChange(
        path,
        storedValue(mask, next, returnMaskedValue) || undefined,
      );
    },
    [handleChange, mask, path, returnMaskedValue],
  );

  const onClear = useCallback(() => {
    setDraft(undefined);
    handleChange(path, undefined);
  }, [handleChange, path]);

  useLayoutEffect(() => {
    const position = pendingCaret.current;
    if (position === undefined) {
      return;
    }
    pendingCaret.current = undefined;
    const field = getInput();
    if (field && field.value === display) {
      field.setSelectionRange(position, position);
    }
  });

  const onChange = useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      // Some input adapters deliver events from a cloned node. Restore the live input.
      const field = getInput();
      const raw = field ? field.value : event.currentTarget.value;
      if (composingRef.current) {
        if (compositionMode === 'defer') setDraft(raw);
        else commit(raw);
        return;
      }
      if (!mask) {
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
          schema.maxLength,
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
      compositionMode,
      getInput,
      appliedUiSchemaOptions.restrict,
      commit,
      display,
      mask,
      returnMaskedValue,
      schema.maxLength,
    ],
  );

  return {
    appliedUiSchemaOptions,
    settings,
    display,
    onClear,
    onChange,
    onCompositionStart() {
      composingRef.current = true;
      if (compositionMode === 'defer') setComposing(true);
    },
    onCompositionEnd(event: React.SyntheticEvent<HTMLInputElement>) {
      composingRef.current = false;
      if (compositionMode === 'defer') setComposing(false);
      onChange(event);
    },
  };
}
