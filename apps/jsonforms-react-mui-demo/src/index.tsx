import React from 'react';
import {
  materialCells,
  materialRenderers,
} from '@jsonforms/material-renderers';
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  Drawer,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import GitHubIcon from '@mui/icons-material/GitHub';
import SettingsIcon from '@mui/icons-material/Settings';
import { WebComponentLogo } from './WebComponentLogo';
import { renderExample } from '@chobantonov/jsonforms-react-demo-common';
import {
  createJsonFormsMuiTheme,
  defaultMuiRendererSettings,
  muiExtendedRenderers,
  MuiRendererSettings,
} from '@chobantonov/jsonforms-react-mui-extended-renderers';
import {
  JSON_FORMS_MUI_TAG,
  registerJsonFormsMui,
} from '@chobantonov/jsonforms-react-mui-webcomponent';
import {
  DemoWrapperProps,
  DemoShellProps,
  ProviderSettingsProps,
} from '@chobantonov/jsonforms-react-demo-common';
import { muiDemoUi } from './DemoUi';

const MUI_LOGO = new URL('./assets/mui.svg', import.meta.url).href;

const MuiDemoShell = ({
  brand,
  rendererName,
  logoSrc,
  dark,
  rtl,
  formOnly,
  sidebarOpen,
  settingsOpen,
  useWebComponent,
  webComponentAvailable,
  search,
  examples,
  currentExampleName,
  settings,
  onHome,
  onSelectExample,
  onSearch,
  onToggleSidebar,
  onToggleFormOnly,
  onToggleWebComponent,
  onOpenSettings,
  onCloseSettings,
  children,
}: DemoShellProps) => {
  const theme = React.useMemo(
    () =>
      createTheme({
        direction: rtl ? 'rtl' : 'ltr',
        palette: { mode: dark ? 'dark' : 'light' },
      }),
    [dark, rtl]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        className={dark ? 'app-shell app-dark' : 'app-shell'}
        dir={rtl ? 'rtl' : 'ltr'}
      >
        <AppBar position='sticky' color='default' elevation={0}>
          <Toolbar className='renderer-demo-header'>
            <IconButton
              edge='start'
              aria-label='Toggle navigation'
              onClick={onToggleSidebar}
            >
              <MenuIcon />
            </IconButton>
            <Button
              color='inherit'
              className='renderer-demo-brand'
              onClick={onHome}
            >
              {logoSrc ? (
                <img
                  alt={`${brand} logo`}
                  className='renderer-demo-logo'
                  src={logoSrc}
                />
              ) : (
                <span className='brand-mark'>{brand[0]}</span>
              )}
              <span>
                <strong>JSON Forms</strong>
                <small>React · {rendererName}</small>
              </span>
            </Button>
            <Box className='renderer-demo-actions'>
              <Tooltip
                title={
                  formOnly ? 'Exit form-only mode' : 'Enter form-only mode'
                }
              >
                <IconButton
                  aria-label={
                    formOnly ? 'Exit form-only mode' : 'Enter form-only mode'
                  }
                  aria-pressed={formOnly}
                  color={formOnly ? 'primary' : 'default'}
                  onClick={onToggleFormOnly}
                >
                  {formOnly ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
              {webComponentAvailable && (
                <Tooltip
                  title={
                    useWebComponent
                      ? 'Show React renderer'
                      : 'Show Web Component'
                  }
                >
                  <IconButton
                    aria-label={
                      useWebComponent
                        ? 'Show React renderer'
                        : 'Show Web Component'
                    }
                    aria-pressed={useWebComponent}
                    color={useWebComponent ? 'primary' : 'default'}
                    onClick={onToggleWebComponent}
                  >
                    <WebComponentLogo active={useWebComponent} dark={dark} />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title='Open repository'>
                <IconButton
                  aria-label='Open repository'
                  component='a'
                  href='https://github.com/kchobantonov/jsonforms-react-renderers'
                  rel='noreferrer'
                  target='_blank'
                >
                  <GitHubIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title='Open settings'>
                <IconButton aria-label='Open settings' onClick={onOpenSettings}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {!formOnly && sidebarOpen && (
          <Paper
            component='aside'
            square
            elevation={0}
            className='renderer-demo-sidebar'
          >
            <TextField
              fullWidth
              size='small'
              label='Search examples'
              value={search}
              onChange={(event) => onSearch(event.target.value)}
            />
            <List dense>
              {examples.map(({ name, label }) => (
                <ListItemButton
                  key={name}
                  selected={name === currentExampleName}
                  onClick={() => onSelectExample(name)}
                >
                  <ListItemText primary={label} />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        )}

        <Box
          component='main'
          className={`renderer-demo-main${
            !sidebarOpen || formOnly ? ' no-sidebar' : ''
          }`}
        >
          {children}
        </Box>

        <Drawer
          anchor={rtl ? 'left' : 'right'}
          open={settingsOpen}
          onClose={onCloseSettings}
        >
          <Box sx={{ width: 'min(30rem, 94vw)', p: 2 }}>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Settings
            </Typography>
            {settings}
          </Box>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
};

const MuiWrapper = ({
  children,
  rendererSettings,
  dark,
  rtl,
}: DemoWrapperProps) => {
  const theme = React.useMemo(
    () =>
      createJsonFormsMuiTheme(
        rendererSettings as MuiRendererSettings,
        dark,
        rtl
      ),
    [dark, rendererSettings, rtl]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          p: 2,
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Box>{children}</Box>
      </Paper>
    </ThemeProvider>
  );
};

const setProviderValue =
  (setSettings: ProviderSettingsProps['setSettings'], key: string) =>
  (value: unknown) => {
    setSettings((oldSettings) => ({
      ...oldSettings,
      [key]: value,
    }));
  };

const MuiSettings = ({ settings, setSettings }: ProviderSettingsProps) => {
  const typedSettings = settings as MuiRendererSettings;
  const setValue = (key: string) => setProviderValue(setSettings, key);

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Typography variant='subtitle1'>MUI</Typography>
      <FormControl fullWidth size='small'>
        <InputLabel>Input variant</InputLabel>
        <Select
          label='Input variant'
          value={typedSettings.inputVariant ?? 'outlined'}
          onChange={(event) => setValue('inputVariant')(event.target.value)}
        >
          <MenuItem value='outlined'>Outlined</MenuItem>
          <MenuItem value='filled'>Filled</MenuItem>
          <MenuItem value='standard'>Standard</MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth size='small'>
        <InputLabel>Density</InputLabel>
        <Select
          label='Density'
          value={typedSettings.density ?? 'comfortable'}
          onChange={(event) => setValue('density')(event.target.value)}
        >
          <MenuItem value='comfortable'>Comfortable</MenuItem>
          <MenuItem value='compact'>Compact</MenuItem>
        </Select>
      </FormControl>
      <TextField
        type='color'
        label='Primary color'
        value={typedSettings.primaryColor ?? '#1976d2'}
        onChange={(event) => setValue('primaryColor')(event.target.value)}
      />
      <TextField
        type='number'
        label='Border radius'
        slotProps={{ htmlInput: { min: 0, max: 24 } }}
        value={typedSettings.borderRadius ?? 8}
        onChange={(event) =>
          setValue('borderRadius')(Number(event.target.value))
        }
      />
      <FormControl fullWidth size='small'>
        <InputLabel>Font family</InputLabel>
        <Select
          label='Font family'
          value={
            typedSettings.fontFamily ?? defaultMuiRendererSettings.fontFamily
          }
          onChange={(event) => setValue('fontFamily')(event.target.value)}
        >
          <MenuItem value={defaultMuiRendererSettings.fontFamily}>
            System
          </MenuItem>
          <MenuItem value='Roboto, Arial, sans-serif'>Roboto</MenuItem>
          <MenuItem value='Georgia, serif'>Serif</MenuItem>
          <MenuItem value='"SFMono-Regular", Consolas, monospace'>
            Monospace
          </MenuItem>
        </Select>
      </FormControl>
      <FormControlLabel
        label='Disable animations'
        control={
          <Switch
            checked={Boolean(typedSettings.disableAnimations)}
            onChange={() =>
              setSettings((oldSettings) => ({
                ...oldSettings,
                disableAnimations: !oldSettings.disableAnimations,
              }))
            }
          />
        }
      />
    </Box>
  );
};

registerJsonFormsMui();

renderExample(
  materialRenderers.concat(muiExtendedRenderers),
  materialCells,
  MuiWrapper,
  {
    brand: 'MUI',
    rendererName: 'MUI',
    logoSrc: MUI_LOGO,
    webComponentTag: JSON_FORMS_MUI_TAG,
    ProviderSettings: MuiSettings,
    initialProviderSettings: defaultMuiRendererSettings,
    initialLayout: 'demo-and-data',
    Shell: MuiDemoShell,
    Ui: muiDemoUi,
  }
);
