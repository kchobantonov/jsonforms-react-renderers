import { ShadcnGridCellFrame } from '@chobantonov/jsonforms-react-shadcn-renderers';
import { Plus, Trash2 } from 'lucide-react';
import { ShadcnArrayFrame } from './ShadcnArrayFrame';
import { createAgGridControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { ShadcnEditorButton } from './ShadcnEditorButton';
import { ShadcnEditorFrame } from './ShadcnEditorFrame';
export const ShadcnAgGridControlRenderer = createAgGridControlRenderer({
  Frame: ShadcnEditorFrame,
  CellFrame: ShadcnGridCellFrame,
  ArrayFrame: ShadcnArrayFrame,
  AddIcon: Plus,
  RemoveIcon: Trash2,
  Button: ShadcnEditorButton,
});
