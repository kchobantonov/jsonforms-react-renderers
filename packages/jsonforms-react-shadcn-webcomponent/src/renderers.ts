import {
  shadcnCells,
  shadcnRenderers,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { createShadcnExtendedRenderers } from '@chobantonov/jsonforms-react-shadcn-extended-renderers';
import { shadcnComponents } from './components/jsonforms';

export const shadcnWebcomponentRenderers = [
  ...shadcnRenderers,
  ...createShadcnExtendedRenderers({ components: shadcnComponents }),
];
export const shadcnWebcomponentCells = shadcnCells;
