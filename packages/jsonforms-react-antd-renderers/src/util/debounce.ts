import debounce from 'lodash/debounce';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRegisterPendingChange } from './pendingChanges';

const eventToValue = (ev: any) => ev.target.value;

/**
 * An ordinary edit, committed after the user stops typing.
 *
 * ## Disposal
 *
 * §18 requires that "disposal must leave no stale write callback active", and
 * that queued work whose target "was removed, rebound, or superseded" is
 * cancelled — explicitly **not** flushed, because "flushing on unmount can
 * recreate deleted data or write into a different item".
 *
 * There are three ways a queued write can outlive its target, and only one of
 * them is an unmount:
 *
 * 1. **The control goes away.** A rule hides it, a tab closes, the form
 *    unmounts. The cleanup below cancels.
 * 2. **The control is rebound to another path.** The debounced function is
 *    keyed on `path`, so a rebind produces a new one and the cleanup cancels
 *    the old — which still holds the old path in its closure.
 * 3. **The path stays, and the thing it points at changes.** This is the
 *    specification's own worked example: type into item 0, delete item 0, and
 *    the former item 1 moves into its place. `ArrayLayout` keys rows by path,
 *    so the control at `items.0` is **not** unmounted and is not rebound — it
 *    re-renders with a different item's data. Neither of the first two cases
 *    fires. As the spec puts it, "the path alone is insufficient evidence
 *    that the original target still exists".
 *
 * The evidence for (3) is the value arriving from outside. The spec asks for
 * external replacement to be distinguished from "normal host feedback of the
 * just-committed data", which is what `lastWritten` is for: data equal to what
 * this control last wrote is its own commit coming back, and anything else is
 * a replacement that supersedes whatever is still queued.
 *
 * Without that distinction the guard eats ordinary typing. A commit lands
 * mid-word, its value returns as a prop, and the keystrokes queued in the
 * meantime would be cancelled along with it.
 */
export const useDebouncedChange = (
  handleChange: (path: string, value: any) => void,
  defaultValue: any,
  data: any,
  path: string,
  eventToValueFunction: (ev: any) => any = eventToValue,
  timeout = 300
): [any, React.ChangeEventHandler, () => void] => {
  const [input, setInput] = useState(data ?? defaultValue);
  /** What this control last wrote, so its own echo is not read as a change. */
  const lastWritten = useRef<any>(data);
  /*
    `useMemo`, not `useCallback`: the argument to `useCallback` is evaluated on
    every render, so a fresh debounced function was constructed and discarded
    each time. Only the identity mattered before; now the cleanup below hangs
    off it, so it should be created exactly once per (handleChange, path).
  */
  const debouncedUpdate = useMemo(
    () =>
      debounce((newValue: any) => {
        lastWritten.current = newValue;
        handleChange(path, newValue);
      }, timeout),
    [handleChange, path, timeout]
  );
  useEffect(() => {
    if (data === lastWritten.current) {
      // Our own commit coming back. Nothing was replaced.
      return;
    }
    // Replaced from outside: the draft was for a value that is no longer here.
    debouncedUpdate.cancel();
    lastWritten.current = data;
    setInput(data ?? defaultValue);
  }, [data]);
  /*
    Disposal, and rebinding. The returned cleanup runs both when this control
    unmounts and when `debouncedUpdate` is replaced, so the instance that is
    going away is the one cancelled — never the new one.
  */
  useEffect(() => () => debouncedUpdate.cancel(), [debouncedUpdate]);
  // A detail dialog applies on demand, so it has to be able to flush or drop
  // whatever this control has not written yet.
  useRegisterPendingChange({
    flush: () => debouncedUpdate.flush(),
    cancel: () => debouncedUpdate.cancel(),
  });
  const onChange = useCallback(
    (ev: any) => {
      const newValue = eventToValueFunction(ev);
      setInput(newValue ?? defaultValue);
      debouncedUpdate(newValue);
    },
    [debouncedUpdate, eventToValueFunction]
  );
  const onClear = useCallback(() => {
    // Clearing supersedes whatever is still queued. Without this, a keystroke
    // made inside the debounce window fires after the clear and writes the old
    // text straight back - the value reappears on its own a fraction of a
    // second later.
    debouncedUpdate.cancel();
    lastWritten.current = undefined;
    setInput(defaultValue);
    handleChange(path, undefined);
  }, [debouncedUpdate, defaultValue, handleChange, path]);
  return [input, onChange, onClear];
};
