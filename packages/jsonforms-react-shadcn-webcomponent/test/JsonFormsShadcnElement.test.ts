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

describe('Web Component host contract', () => {
  let element: JsonFormsShadcnElement;
  beforeEach(() => {
    registerJsonFormsShadcn();
    element = document.createElement(
      JSON_FORMS_SHADCN_TAG
    ) as JsonFormsShadcnElement;
    element.schema = {
      type: 'object',
      properties: { name: { type: 'string' } },
    };
    element.uischema = { type: 'Control', scope: '#/properties/name' };
    element.data = { name: 'Ada' };
  });
  afterEach(() => element.remove());
  it.each([true, 'true', ''])('honors readonly %j', async (readonly) => {
    element.readonly = readonly;
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')?.disabled).toBe(true)
    );
    expect(
      element.shadowRoot?.querySelector('[aria-label="Clear value"]')
    ).toBeNull();
  });
  it.each([true, false])('honors RTL %j', async (rtl) => {
    element.rtl = rtl;
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')).not.toBeNull()
    );
    expect(
      element.shadowRoot
        ?.querySelector('.shadcn-jsonforms-host')
        ?.getAttribute('dir')
    ).toBe(rtl ? 'rtl' : null);
  });
  it('updates an existing host when data changes', async () => {
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')?.value).toBe('Ada')
    );
    element.data = { name: 'Grace' };
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')?.value).toBe('Grace')
    );
  });
  it('accepts JSON attributes', async () => {
    element.setAttribute('data', JSON.stringify({ name: 'From attribute' }));
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')?.value).toBe(
        'From attribute'
      )
    );
  });
  it('emits composed change events for edits', async () => {
    const change = vi.fn();
    element.addEventListener('change', change);
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')).not.toBeNull()
    );
    const input = element.shadowRoot!.querySelector('input')!;
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!.call(input, 'Grace');
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await vi.waitFor(() =>
      expect(
        change.mock.calls.some(([event]) => event.detail.data.name === 'Grace')
      ).toBe(true)
    );
    const event = change.mock.calls.find(
      ([event]) => event.detail.data.name === 'Grace'
    )![0];
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });
  it('can reconnect after unmounting', async () => {
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')).not.toBeNull()
    );
    element.remove();
    document.body.append(element);
    await vi.waitFor(() =>
      expect(element.shadowRoot?.querySelector('input')?.value).toBe('Ada')
    );
  });
});
