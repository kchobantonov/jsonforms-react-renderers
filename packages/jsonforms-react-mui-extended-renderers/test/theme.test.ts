import {
  createJsonFormsMuiTheme,
  defaultMuiRendererSettings,
  normalizeMuiRendererSettings,
} from '../src/theme';

describe('MUI renderer theme', () => {
  it('does not allow undefined web-component properties to replace defaults', () => {
    const settings = normalizeMuiRendererSettings({
      inputVariant: undefined,
      density: undefined,
      primaryColor: undefined,
      borderRadius: undefined,
      fontFamily: undefined,
      disableAnimations: undefined,
    });

    expect(settings).toEqual(defaultMuiRendererSettings);
    expect(() => createJsonFormsMuiTheme(settings)).not.toThrow();
  });

  it('replaces invalid runtime theme values with safe defaults', () => {
    const settings = normalizeMuiRendererSettings({
      inputVariant: 'invalid' as any,
      density: 'invalid' as any,
      primaryColor: '',
      borderRadius: 'invalid' as any,
      fontFamily: '',
      disableAnimations: 'false' as any,
    });

    expect(settings).toEqual(defaultMuiRendererSettings);
    expect(createJsonFormsMuiTheme(settings).palette.primary.main).toBe(
      defaultMuiRendererSettings.primaryColor
    );
  });
});
