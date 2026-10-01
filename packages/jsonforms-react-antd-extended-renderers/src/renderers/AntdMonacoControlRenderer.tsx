import { createMonacoControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { AntdEditorToggleButton } from './AntdEditorButton';
import { AntdEditorFrame } from './AntdEditorFrame';
import { AntdEditorLoadError, AntdEditorLoading } from './AntdEditorLoading';
import { AntdEditorSurface } from './AntdEditorSurface';
import { useAntdEditorTheme } from './useAntdEditorTheme';

export const AntdMonacoControlRenderer = createMonacoControlRenderer({
  Frame: AntdEditorFrame,
  Button: AntdEditorToggleButton,
  MaximizeIcon: FullscreenOutlined,
  MinimizeIcon: FullscreenExitOutlined,
  Surface: AntdEditorSurface,
  useEditorTheme: useAntdEditorTheme,
  Loading: AntdEditorLoading,
  LoadError: AntdEditorLoadError,
});
