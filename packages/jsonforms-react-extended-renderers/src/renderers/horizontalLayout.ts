import type { CSSProperties } from 'react';

export const HORIZONTAL_COLUMNS = 16;

export const isValidColumns = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === 'auto' ||
  (typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 2 &&
    value <= HORIZONTAL_COLUMNS);

/** Allocate direct, visible children without changing their UI schemas. */
export const horizontalLayoutWidths = (
  values: readonly unknown[],
  gap = '1rem'
) => {
  const fixed = values.map((value) =>
    typeof value === 'number' && isValidColumns(value) ? value : undefined
  );
  const rows: number[][] = [[]];
  const allAuto = fixed.every((value) => value === undefined);
  let used = 0;
  fixed.forEach((value, index) => {
    const minimum = value ?? 2;
    if (!allAuto && used + minimum > HORIZONTAL_COLUMNS) {
      rows.push([]);
      used = 0;
    }
    rows[rows.length - 1].push(index);
    used += minimum;
  });
  return rows.flatMap((indices, row) => {
    const reserved = indices.reduce(
      (sum, index) => sum + (fixed[index] ?? 0),
      0
    );
    const autos = indices.filter((index) => fixed[index] === undefined).length;
    return indices.map((index) => {
      const columns = fixed[index] ?? (HORIZONTAL_COLUMNS - reserved) / autos;
      const fraction = columns / HORIZONTAL_COLUMNS;
      const style: CSSProperties = {
        flex: `0 0 calc(${fraction * 100}% - ${gap} * ${
          (indices.length - 1) * fraction
        })`,
        minWidth: 0,
      };
      return {
        row,
        columns,
        style,
        diagnostic: isValidColumns(values[index])
          ? undefined
          : 'Columns must be Auto or an integer from 2 through 16.',
      };
    });
  });
};
