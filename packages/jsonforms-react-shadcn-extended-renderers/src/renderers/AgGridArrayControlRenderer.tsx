import { createAgGridControl } from '@chobantonov/jsonforms-react-extended-renderers';
import { Button } from '@chobantonov/jsonforms-react-shadcn-renderers';
import { ShadcnEditorFrame } from './ShadcnEditorFrame';
export { extendedAgGridTester as agGridArrayTester } from '@chobantonov/jsonforms-react-extended-renderers';
export { ShadcnAgGridControlRenderer as AgGridArrayControlRenderer } from './ShadcnAgGridControlRenderer';
export const ShadcnAgGridArrayControl = createAgGridControl({
  Frame: ShadcnEditorFrame,
  Button,
});
