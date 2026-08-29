import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { antdExtendedRenderers } from '@chobantonov/jsonforms-react-antd-extended-renderers';

export const antdWebcomponentRenderers = [
  ...antdRenderers,
  ...antdExtendedRenderers,
];
export const antdWebcomponentCells = antdCells;
