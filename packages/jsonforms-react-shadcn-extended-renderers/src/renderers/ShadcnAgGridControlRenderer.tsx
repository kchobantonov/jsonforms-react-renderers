import React from 'react';
import {
  ShadcnGridCellFrame,
  RowDetailFrame,
  RowDetailEditButton,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import { Plus, Trash2, Pencil, Eye, EyeOff } from 'lucide-react';
import { ShadcnArrayFrame } from './ShadcnArrayFrame';
import { createAgGridControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { ShadcnEditorButton } from './ShadcnEditorButton';
import { ShadcnEditorFrame } from './ShadcnEditorFrame';
export const ShadcnAgGridControlRenderer = createAgGridControlRenderer({
  Frame: ShadcnEditorFrame,
  RowDetailButton: (props) => <RowDetailEditButton
    label={props['aria-label'] ?? props.title ?? ''}
    onClick={props.onClick} disabled={props.disabled} />,
  RowDetailFrame,
  EditIcon: Pencil,
  ShowDetailsIcon: Eye,
  HideDetailsIcon: EyeOff,
  CellFrame: ShadcnGridCellFrame,
  ArrayFrame: ShadcnArrayFrame,
  AddIcon: Plus,
  RemoveIcon: Trash2,
  Button: ShadcnEditorButton,
});
