import { createAgGridControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { PrimeEditorButton } from './PrimeEditorButton';
import { PrimeEditorFrame } from './PrimeEditorFrame';
export const PrimeAgGridControlRenderer = createAgGridControlRenderer({
  Frame: PrimeEditorFrame,
  Button: PrimeEditorButton,
});
