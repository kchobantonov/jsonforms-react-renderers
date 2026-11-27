import { CellProps, WithClassname } from '@jsonforms/core';
import { AntdClearableInput } from '@chobantonov/jsonforms-react-antd-renderers';
import { Input } from 'antd';
import type { InputRef } from 'antd';
import React, { useRef, useCallback } from 'react';
import { useMaskedInput } from '@chobantonov/jsonforms-react-renderer-common/formats/useMaskedInput';

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
    },
) {
  const { data, className, id, enabled, inputProps } = props;
  const inputRef = useRef<InputRef>(null);
  const getInput = useCallback(() => inputRef.current?.input, []);
  const {
    appliedUiSchemaOptions,
    settings,
    display,
    onClear,
    onChange,
    onCompositionStart,
    onCompositionEnd,
  } = useMaskedInput(props, getInput, 'commit');

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
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
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
