import {
  JSON_FORMS_ANTD_TAG,
  JsonFormsAntdElement,
  registerJsonFormsAntd,
} from '../src/JsonFormsAntdElement';

describe('JsonFormsAntdElement', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
  });

  it('renders Ant Design controls and their generated styles in the shadow root', async () => {
    registerJsonFormsAntd();
    const element = document.createElement(
      JSON_FORMS_ANTD_TAG
    ) as JsonFormsAntdElement;
    element.data = { name: 'Ada' };
    element.schema = {
      type: 'object',
      properties: { name: { type: 'string' } },
    };
    element.uischema = {
      type: 'Control',
      scope: '#/properties/name',
    };

    document.body.append(element);

    await vi.waitFor(() => {
      expect(element.shadowRoot?.querySelector('input')).not.toBeNull();
      expect(
        element.shadowRoot?.querySelector('style[data-css-hash]')
      ).not.toBeNull();
    });

    expect(
      element.shadowRoot?.querySelector('input')?.getAttribute('value')
    ).toBe('Ada');
    expect(element.shadowRoot?.textContent).toContain(
      ':host { display: block; color-scheme: light; }'
    );

    element.dark = true;
    await vi.waitFor(() => {
      expect(element.shadowRoot?.textContent).toContain(
        ':host { display: block; color-scheme: dark; }'
      );
    });

    element.remove();
  });

  it('waits for properties when connected before configuration', async () => {
    registerJsonFormsAntd();
    const element = document.createElement(
      JSON_FORMS_ANTD_TAG
    ) as JsonFormsAntdElement;

    expect(() => document.body.append(element)).not.toThrow();
    await Promise.resolve();
    expect(element.shadowRoot?.children).toHaveLength(0);

    element.data = { name: 'Ada' };
    element.schema = {
      type: 'object',
      properties: { name: { type: 'string' } },
    };
    element.uischema = {
      type: 'Control',
      scope: '#/properties/name',
    };

    await vi.waitFor(() => {
      expect(element.shadowRoot?.querySelector('input')).not.toBeNull();
    });

    element.remove();
    await Promise.resolve();
  });
});
