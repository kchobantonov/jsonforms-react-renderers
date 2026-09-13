import { createMonacoControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from 'primereact/button';
import { PrimeEditorFrame } from './PrimeEditorFrame';
export const PrimeMonacoControlRenderer = createMonacoControlRenderer({
  Frame: PrimeEditorFrame,
  Button,
});
