import {
  shadcnExtendedCells,
  createShadcnExtendedRenderers,
} from '@chobantonov/jsonforms-react-shadcn-extended-renderers';
import {
  shadcnCells,
  shadcnRenderers,
} from '@chobantonov/jsonforms-react-shadcn-renderers';

export const shadcnWebcomponentRenderers = [
  ...shadcnRenderers,
  ...createShadcnExtendedRenderers(),
];
export const shadcnWebcomponentCells = [...shadcnExtendedCells, ...shadcnCells];
