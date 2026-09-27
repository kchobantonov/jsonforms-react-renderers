import { createMonacoControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { PrimeEditorButton } from './PrimeEditorButton';
import { PrimeEditorFrame } from './PrimeEditorFrame';
export const PrimeMonacoControlRenderer = createMonacoControlRenderer({
  Frame: PrimeEditorFrame,
  Button: PrimeEditorButton,
});
