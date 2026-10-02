import { useEffect, useState } from 'react';
import { getJsonDataType, JsonDataType } from './mixed';

/** Numeric editor intent cannot be reconstructed from JSON: 2 is both types. */
export const useMixedType = (
  data: unknown,
  types: JsonDataType[],
  path: string
) => {
  const [numeric, setNumeric] = useState<{
    type: JsonDataType;
    path: string;
    types: string;
  }>();
  const typeKey = types.join(',');
  useEffect(() => {
    if (typeof data !== 'number') setNumeric(undefined);
  }, [data]);
  const detected = getJsonDataType(data);
  const inferred =
    detected && types.includes(detected)
      ? detected
      : detected === 'integer' && types.includes('number')
      ? 'number'
      : null;
  const selectedType =
    typeof data === 'number' &&
    numeric?.path === path &&
    numeric.types === typeKey &&
    types.includes(numeric.type)
      ? numeric.type
      : inferred;
  const selectNumericType = (type: JsonDataType) =>
    setNumeric({ type, path, types: typeKey });
  return { selectedType, selectNumericType };
};
