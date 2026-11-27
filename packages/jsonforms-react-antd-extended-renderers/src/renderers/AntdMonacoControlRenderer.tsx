import { createMonacoControlRenderer } from '@chobantonov/jsonforms-react-extended-renderers';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { AntdEditorToggleButton } from '../components/AntdEditorButton';
import { AntdEditorFrame } from '../components/AntdEditorFrame';
import {
  AntdEditorLoadError,
  AntdEditorLoading,
} from '../components/AntdEditorLoading';
import { AntdEditorSurface } from '../components/AntdEditorSurface';
import { useAntdEditorTheme } from '../hooks/useAntdEditorTheme';

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
