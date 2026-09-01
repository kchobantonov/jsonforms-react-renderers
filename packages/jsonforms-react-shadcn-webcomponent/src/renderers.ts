import {
  shadcnCells,
  shadcnRenderers,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { createShadcnExtendedRenderers } from '@chobantonov/jsonforms-react-shadcn-extended-renderers';

export const shadcnWebcomponentRenderers = [
  ...shadcnRenderers,
  ...createShadcnExtendedRenderers(),
];
export const shadcnWebcomponentCells = shadcnCells;
