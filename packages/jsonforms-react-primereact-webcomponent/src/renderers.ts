import {
  primereactCells,
  primereactRenderers,
} from '@chobantonov/jsonforms-react-primereact-renderers';
import { primereactExtendedRenderers } from '@chobantonov/jsonforms-react-primereact-extended-renderers';

export const primereactWebcomponentRenderers = [
  ...primereactRenderers,
  ...primereactExtendedRenderers,
];
export const primereactWebcomponentCells = primereactCells;
