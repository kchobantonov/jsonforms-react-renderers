import { createDeleteConfirmation } from '@chobantonov/jsonforms-react-renderer-common/interaction/createDeleteConfirmation';
import {
  ErrorIndicator,
  ShadcnGridCellFrame,
  RowDetailFrame,
  RowDetailEditButton,
  useConfirmation,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import React from 'react';
import { Plus, Trash2, Pencil, Eye, EyeOff } from 'lucide-react';
import { ShadcnArrayFrame } from '../components/ShadcnArrayFrame';
import { createAgGridControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { ShadcnEditorButton } from '../components/ShadcnEditorButton';
import { ShadcnEditorFrame } from '../components/ShadcnEditorFrame';
const useAgGridRemoveConfirmation = createDeleteConfirmation(
  useConfirmation,
  'agGrid',
);

export const ShadcnAgGridControlRenderer = createAgGridControlRenderer({
  RowErrorIndicator: ({ message }) => <ErrorIndicator errors={message} />,
  Frame: ShadcnEditorFrame,
  RowDetailButton: (props) => (
    <RowDetailEditButton
      label={props['aria-label'] ?? props.title ?? ''}
      onClick={props.onClick}
      disabled={props.disabled}
    />
  ),
  RowDetailFrame,
  useRemoveConfirmation: useAgGridRemoveConfirmation,
  EditIcon: Pencil,
  ShowDetailsIcon: Eye,
  HideDetailsIcon: EyeOff,
  CellFrame: ShadcnGridCellFrame,
  ArrayFrame: ShadcnArrayFrame,
  AddIcon: Plus,
  RemoveIcon: Trash2,
  Button: ShadcnEditorButton,
});
