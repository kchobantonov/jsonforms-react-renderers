import { createContext, useContext } from 'react';

/** Only the scalar owned by a mixed type selector retains its empty value.
 * Ordinary optional fields keep their existing clear-to-absent behavior. */
export const MixedScalarContext = createContext<string | undefined>(undefined);
export const useMixedScalar = (path: string) =>
  useContext(MixedScalarContext) === path;
