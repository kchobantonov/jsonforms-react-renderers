import {
  JSON_FORMS_SHADCN_TAG,
  JsonFormsShadcnElement,
  registerJsonFormsShadcn,
} from '../src/JsonFormsShadcnElement';

describe('JsonFormsShadcnElement', () => {
  it('ships the original Shadcn utility styles inside its shadow root', async () => {
    registerJsonFormsShadcn();
    const element = document.createElement(
      JSON_FORMS_SHADCN_TAG
    ) as JsonFormsShadcnElement;
    element.dark = true;
    element.data = { name: '' };
    element.schema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    };
    element.uischema = {
      type: 'Control',
      scope: '#/properties/name',
    };

    document.body.append(element);

    await vi.waitFor(() => {
      expect(element.shadowRoot?.querySelector('input')).not.toBeNull();
    });

    const host = element.shadowRoot?.querySelector('.shadcn-jsonforms-host');
    const input = element.shadowRoot?.querySelector('input');

    expect(host?.classList).toContain('app-dark');
    expect(host?.classList).toContain('dark');
    expect(element.shadowRoot?.querySelectorAll('style')).toHaveLength(3);
    expect(input?.classList).toContain('h-10');
    expect(input?.classList).toContain('bg-background');
    expect(element.shadowRoot?.textContent).not.toContain(
      'name.error.required'
    );

    element.remove();
  });
});
