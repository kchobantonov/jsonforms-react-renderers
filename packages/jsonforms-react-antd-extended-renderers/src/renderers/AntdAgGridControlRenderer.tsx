import { createAgGridControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import {
  ConnectedCellFrame,
  useConfirmation,
} from '@chobantonov/jsonforms-react-antd-renderers';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { AntdEditorButton } from './AntdEditorButton';
import { AntdArrayFrame } from './AntdArrayFrame';
import { AntdEditorFrame } from './AntdEditorFrame';
import { AntdEditorLoadError, AntdEditorLoading } from './AntdEditorLoading';
import { useAntdEditorTheme } from './useAntdEditorTheme';
/**
 * The grid's own confirmation, supplied from this side of the boundary.
 *
 * The agnostic renderer knows only that something would be discarded; the
 * catalog id - `agGrid`, section 14's name for this renderer - belongs here,
 * with the renderer set that actually registers it. That keeps the
 * framework-agnostic package free of both antd and the policy vocabulary.
 */
const useAgGridRemoveConfirmation = () => {
  const confirmation = useConfirmation();
  return {
    request: (input: {
      discarded: unknown[];
      options?: Record<string, unknown>;
      config?: unknown;
      perform: () => void;
    }) =>
      confirmation.request({
        operation: 'delete',
        catalogId: 'agGrid',
        ...input,
      }),
    dialog: confirmation.dialog,
  };
};

export const AntdAgGridControlRenderer = createAgGridControlRenderer({
  Frame: AntdEditorFrame,
  ArrayFrame: AntdArrayFrame,
  CellFrame: ConnectedCellFrame,
  Button: AntdEditorButton,
  AddIcon: PlusOutlined,
  RemoveIcon: DeleteOutlined,
  useEditorTheme: useAntdEditorTheme,
  Loading: AntdEditorLoading,
  LoadError: AntdEditorLoadError,
  useRemoveConfirmation: useAgGridRemoveConfirmation,
});
