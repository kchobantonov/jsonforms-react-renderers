import { createAgGridControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from 'primereact/button';
import { PrimeEditorFrame } from './PrimeEditorFrame';
export const PrimeAgGridControlRenderer = createAgGridControlRenderer({
  Frame: PrimeEditorFrame,
  Button,
});
