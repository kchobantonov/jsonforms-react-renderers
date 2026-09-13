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

  it.each(['light', 'dark'])(
    'keeps date picker popups in the styled %s shadow root',
    async (mode) => {
      registerJsonFormsMui();
      const element = document.createElement(
        JSON_FORMS_MUI_TAG
      ) as JsonFormsMuiElement;
      element.schema = { type: 'string', format: 'date' };
      element.uischema = { type: 'Control', scope: '#' };
      element.data = JSON.stringify('2024-01-15');
      element.setAttribute('mode', mode);
      document.body.append(element);
      try {
        await vi.waitFor(() => {
          const button = element.shadowRoot!.querySelector<HTMLButtonElement>(
            'button[aria-label^="Choose date"]'
          );
          expect(button).not.toBeNull();
        });
        element
          .shadowRoot!.querySelector<HTMLButtonElement>(
            'button[aria-label^="Choose date"]'
          )!
          .click();
        await vi.waitFor(() => {
          expect(
            element.shadowRoot!.querySelector('[role="dialog"]')
          ).not.toBeNull();
        });
        expect(document.body.querySelector('[role="dialog"]')).toBeNull();
        expect(
          element
            .shadowRoot!.querySelector('.jsonforms-react-mui')!
            .contains(element.shadowRoot!.querySelector('[role="dialog"]'))
        ).toBe(true);
      } finally {
        element.remove();
      }
    }
  );

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
