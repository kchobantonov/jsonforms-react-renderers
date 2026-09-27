import React, { createContext, useContext } from 'react';

const CellModeContext = createContext(false);

/**
 * Marks a subtree as rendering inside a table cell. Controls keep their normal
 * implementation - there is deliberately no separate "cell" copy of each
 * renderer - but drop the chrome a cell has no room for.
 *
 * Pass `value={false}` to leave cell mode again. A detail dialog opened from a
 * cell needs this: it portals elsewhere in the DOM, but React context follows
 * the component tree, so without it the dialog's fields render label-less too.
 */
export const CellModeProvider = ({
  value = true,
  children,
}: React.PropsWithChildren<{ value?: boolean }>) => (
  <CellModeContext.Provider value={value}>{children}</CellModeContext.Provider>
);

export const useCellMode = (): boolean => useContext(CellModeContext);
