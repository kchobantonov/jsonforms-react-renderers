import {
  JSON_FORMS_MUI_TAG,
  JsonFormsMuiElement,
  registerJsonFormsMui,
} from '../src/JsonFormsMuiElement';

describe('JsonFormsMuiElement', () => {
  it('connects safely before renderer settings are assigned', async () => {
    registerJsonFormsMui();
    const element = document.createElement(
      JSON_FORMS_MUI_TAG
    ) as JsonFormsMuiElement;

    document.body.append(element);

    await vi.waitFor(() => {
      expect(
        element.shadowRoot?.querySelector('.jsonforms-react-mui')
      ).not.toBeNull();
    });
    expect(element.shadowRoot?.textContent).not.toContain('undefined');

    element.remove();
  });

  it('ignores explicitly undefined theme settings', async () => {
    const element = document.createElement(
      JSON_FORMS_MUI_TAG
    ) as JsonFormsMuiElement;
    element.rendererSettings = {
      inputVariant: undefined,
      density: undefined,
      primaryColor: undefined,
      borderRadius: undefined,
      fontFamily: undefined,
      disableAnimations: undefined,
    };

    document.body.append(element);

    await vi.waitFor(() => {
      expect(
        element.shadowRoot?.querySelector('.jsonforms-react-mui')
      ).not.toBeNull();
    });

    element.remove();
  });
});
