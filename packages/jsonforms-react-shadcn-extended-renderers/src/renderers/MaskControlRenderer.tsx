import { ControlProps } from '@jsonforms/core';
import {
  ClearValueButton,
  InputShell,
  makeId,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { extendedMaskTester } from '@chobantonov/jsonforms-react-extended-renderers';
import { Input } from '@jsonforms-react-shadcn-ui/input';

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
} from '@chobantonov/jsonforms-react-renderer-common/maskFormat';

const reportedMasks = new Set<string>();

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

export const ShadcnMaskControl = React.memo(function ShadcnMaskControl(
  props: ControlProps
) {
  const { data, config, enabled, uischema, path, handleChange, schema } = props;

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

  const inputRef = useRef<HTMLInputElement>(null);
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
    if (composing.current && draft !== undefined) return draft;
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

  useLayoutEffect(() => {
    const position = pendingCaret.current;
    if (position === undefined) {
      return;
    }
    pendingCaret.current = undefined;
    const field = inputRef.current;
    if (field && field.value === display) {
      field.setSelectionRange(position, position);
    }
  });

  const onChange = useCallback(
    (event: React.SyntheticEvent<HTMLInputElement>) => {
      // The real node, never the event's - see `inputRef`. Its value is still
      // the text as typed at this point, because React has not committed yet.
      const field = inputRef.current;
      const raw = field ? field.value : event.currentTarget.value;
      if (composing.current) {
        setDraft(raw);
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

  if (props.visible === false) return null;
  const id = makeId(path, props.label);
  return (
    <InputShell {...props} id={id}>
      <div className='group relative w-full'>
        <ClearValueButton
          clearable={appliedUiSchemaOptions.clearable !== false}
          data={data}
          enabled={enabled && !props.readonly}
          onClear={onClear}
        />
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
          className='pr-10'
          id={id}
          disabled={!enabled || props.readonly}
          aria-invalid={Boolean(props.errors)}
          autoFocus={appliedUiSchemaOptions.focus}
          style={{ width: '100%' }}
          placeholder={
            appliedUiSchemaOptions.placeholder ??
            (typeof settings?.mask === 'string' ? settings.mask : undefined)
          }
          data-mask-input
        />
      </div>
    </InputShell>
  );
});

export const maskControlTester = extendedMaskTester;
export const MaskControlRenderer = withJsonFormsControlProps(ShadcnMaskControl);
