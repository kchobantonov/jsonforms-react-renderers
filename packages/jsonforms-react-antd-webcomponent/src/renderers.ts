import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import {
  antdExtendedCells,
  antdExtendedRenderers,
} from '@chobantonov/jsonforms-react-antd-extended-renderers';

export const antdWebcomponentRenderers = [
  ...antdRenderers,
  ...antdExtendedRenderers,
];
/*
  The extended cells are concatenated, not omitted: a column whose schema says
  `format: "color"` or `format: "duration"` would otherwise fall back to a
  plain text cell, because both controls exist only in the renderer registry
  and array columns dispatch through the cells registry.
*/
export const antdWebcomponentCells = [...antdCells, ...antdExtendedCells];
