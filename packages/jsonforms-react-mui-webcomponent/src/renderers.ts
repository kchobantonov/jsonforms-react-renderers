import {
  materialCells,
  materialRenderers,
} from '@jsonforms/material-renderers';
import { muiExtendedRenderers } from '@chobantonov/jsonforms-react-mui-extended-renderers';

export const muiWebcomponentRenderers = [
  ...materialRenderers,
  ...muiExtendedRenderers,
];
export const muiWebcomponentCells = materialCells;
