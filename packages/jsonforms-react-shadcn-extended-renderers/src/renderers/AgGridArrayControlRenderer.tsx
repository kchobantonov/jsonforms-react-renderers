import { ShadcnGridCellFrame } from '@chobantonov/jsonforms-react-shadcn-renderers';
import { Plus, Trash2 } from 'lucide-react';
import { ShadcnArrayFrame } from './ShadcnArrayFrame';
import { createAgGridControl } from '@chobantonov/jsonforms-react-extended-renderers';
import { ShadcnEditorButton } from './ShadcnEditorButton';
import { ShadcnEditorFrame } from './ShadcnEditorFrame';
export { extendedAgGridTester as agGridArrayTester } from '@chobantonov/jsonforms-react-extended-renderers';
export { ShadcnAgGridControlRenderer as AgGridArrayControlRenderer } from './ShadcnAgGridControlRenderer';
export const ShadcnAgGridArrayControl = createAgGridControl({
  Frame: ShadcnEditorFrame,
  CellFrame: ShadcnGridCellFrame,
  ArrayFrame: ShadcnArrayFrame,
  AddIcon: Plus,
  RemoveIcon: Trash2,
  Button: ShadcnEditorButton,
});
