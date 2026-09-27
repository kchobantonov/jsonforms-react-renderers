import React, { createContext, useContext, useEffect, useMemo } from 'react';

export type PendingChange = {
  /** Apply the outstanding value now. */
  flush: () => void;
  /** Drop the outstanding value. */
  cancel: () => void;
};

const PendingChangesContext = createContext<Set<PendingChange> | undefined>(
  undefined
);

/**
 * Text controls debounce their writes, so a value the user has typed may not
 * have reached the form data yet when a dialog's Apply is pressed. Controls
 * register their pending write here; the dialog flushes them all before it
 * reads the draft, and cancels them when it is dismissed.
 *
 * Outside a provider this is inert, which is what an ordinary form wants.
 */
export const PendingChangesProvider = ({
  changes,
  children,
}: React.PropsWithChildren<{ changes: Set<PendingChange> }>) => (
  <PendingChangesContext.Provider value={changes}>
    {children}
  </PendingChangesContext.Provider>
);

export const useRegisterPendingChange = (change: PendingChange) => {
  const pending = useContext(PendingChangesContext);
  // The registered entry has to stay stable, or every render would leave a
  // stale one behind in the set.
  const entry = useMemo<PendingChange>(
    () => ({
      flush: () => entry.current.flush(),
      cancel: () => entry.current.cancel(),
      current: change,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  ) as PendingChange & { current: PendingChange };
  entry.current = change;
  useEffect(() => {
    if (!pending) return undefined;
    pending.add(entry);
    return () => {
      // Unmounting while a write is outstanding must not let it land after
      // the dialog that owned it has gone.
      entry.cancel();
      pending.delete(entry);
    };
  }, [pending, entry]);
};
