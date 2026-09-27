import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdRenderers,
  antdCells,
  CellModeProvider,
} from '@chobantonov/jsonforms-react-antd-renderers';
import {
  AntdColorControlRenderer,
  antdColorControlTester,
} from '../src/renderers/AntdColorControlRenderer';

// antd's ColorPicker measures its popup, and its panel portals to
// document.body: without a ResizeObserver the panel throws on open, and
// without clearing the body a later test finds the previous test's panel.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver =
  (globalThis as any).ResizeObserver ?? ResizeObserverStub;

afterEach(() => {
  document.body.innerHTML = '';
});

// JsonForms debounces its own onChange by 10ms, so a commit is not visible to
// the test's listener in the same tick it was dispatched.
const settle = async (ms = 30) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const schema = {
  type: 'object',
  properties: { brand: { type: 'string', format: 'color' } },
};
const plainSchema = {
  type: 'object',
  properties: { brand: { type: 'string' } },
};
const uischema = {
  type: 'Control',
  scope: '#/properties/brand',
  label: 'Brand color',
};

interface RenderOptions {
  cell?: boolean;
  data?: any;
  options?: Record<string, unknown>;
  config?: Record<string, unknown>;
  schema?: any;
}

const render = ({
  cell = false,
  data = { brand: '#00ff00' },
  options,
  config,
  schema: formSchema = schema,
}: RenderOptions = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = data;
  const form = (
    <ConfigProvider>
      <JsonForms
        data={data}
        schema={formSchema as any}
        uischema={{ ...uischema, ...(options ? { options } : {}) } as any}
        config={config}
        renderers={[
          ...antdRenderers,
          {
            tester: antdColorControlTester,
            renderer: AntdColorControlRenderer,
          },
        ]}
        cells={antdCells}
        onChange={({ data: next }) => {
          latest = next;
        }}
      />
    </ConfigProvider>
  );
  act(() =>
    root.render(cell ? <CellModeProvider>{form}</CellModeProvider> : form)
  );

  const input = () => container.querySelector<HTMLInputElement>('input');
  const type = async (text: string) => {
    const field = input()!;
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )!.set!;
    act(() => {
      setter.call(field, text);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await settle();
  };
  const blur = async () => {
    act(() => {
      // React delegates onBlur from `focusout`, not from the non-bubbling
      // `blur` event, so dispatching `blur` here never reaches the handler.
      input()!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    });
    await settle();
  };

  return {
    container,
    input,
    type,
    blur,
    stored: () => latest.brand,
    unmount: () => act(() => root.unmount()),
  };
};

describe('antd color control', () => {
  it('shows the value as editable text, not a read-only swatch', () => {
    const { input, unmount } = render();
    expect(input()).toBeTruthy();
    expect(input()!.value).toBe('#00ff00');
    expect(input()!.readOnly).toBe(false);
    unmount();
  });

  it('offers a color picker and a clear affordance in the same field', () => {
    const { container, unmount } = render();
    // A custom swatch trigger, not antd's default one: that trigger's own
    // border/padding/min-height made it sit off-centre inside the prefix.
    const swatch = container.querySelector<HTMLElement>(
      '[aria-label="Choose a color"]'
    );
    expect(swatch).toBeTruthy();
    const prefix = container.querySelector('.ant-input-prefix');
    expect(prefix?.contains(swatch!)).toBe(true);
    unmount();
  });

  // The clear button is gated: only when there is a value AND the control is
  // hovered or focused, so populated fields do not carry a permanent x.
  it('hides the clear button until hovered or focused', () => {
    const { container, unmount } = render();
    expect(container.querySelector('.ant-input-clear-icon')).toBeNull();
    const field = container.querySelector('input')!;
    act(() => {
      field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(container.querySelector('.ant-input-clear-icon')).toBeTruthy();
    unmount();
  });

  it('never shows the clear button without a value', () => {
    const { container, unmount } = render({ data: {} });
    const field = container.querySelector('input')!;
    act(() => {
      field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(container.querySelector('.ant-input-clear-icon')).toBeNull();
    unmount();
  });

  it('shows the current value in the swatch', () => {
    const { container, unmount } = render();
    const swatch = container.querySelector<HTMLElement>(
      '[aria-label="Choose a color"] span'
    );
    expect(swatch!.style.background).toBe('rgb(0, 255, 0)');
    unmount();
  });

  it('drops the label inside a table cell', () => {
    const { container, unmount } = render({ cell: true });
    expect(container.innerHTML).not.toContain('Brand color');
    unmount();
  });

  it('is selected by a UI format on a plain string, not only a schema format', () => {
    // Section 18 allows either selection path. The antd-local tester used to
    // check the schema format alone, so this rendered as a plain text box.
    const { container, unmount } = render({
      schema: plainSchema,
      options: { format: 'color' },
    });
    expect(
      container.querySelector('[aria-label="Choose a color"]')
    ).toBeTruthy();
    unmount();
  });
});

describe('color save formats', () => {
  const cases: [string, string, string][] = [
    ['hex', '#0f0', '#00ff00'],
    ['hex3', '#00ff00', '#0f0'],
    ['rgb', '#00ff00', 'rgb(0, 255, 0)'],
    ['hsb', '#00ff00', 'hsb(120, 100%, 100%)'],
  ];

  it.each(cases)(
    'serializes a typed color to %s on blur',
    async (format, typed, expected) => {
      const { type, blur, stored, unmount } = render({
        data: {},
        options: { colorSaveFormat: format },
      });
      await type(typed);
      // Committed as typed while the field has focus: normalizing per keystroke
      // would rewrite `#0f0` mid-entry and move the caret.
      expect(stored()).toBe(typed);
      await blur();
      expect(stored()).toBe(expected);
      unmount();
    }
  );

  it('accepts any supported representation as input regardless of save format', async () => {
    const { type, blur, stored, unmount } = render({
      data: {},
      options: { colorSaveFormat: 'rgb' },
    });
    await type('hsb(120, 100%, 100%)');
    await blur();
    expect(stored()).toBe('rgb(0, 255, 0)');
    unmount();
  });

  it('accepts hsl as input although it is never written', async () => {
    // The specification lists `hsl` as a save format; this project does not
    // emit it, because the picker cannot edit it. Reading it still works, so
    // data from a system that does emit it is not stranded.
    const { type, blur, stored, unmount } = render({
      data: {},
      options: { colorSaveFormat: 'hsb' },
    });
    await type('hsl(120, 100%, 50%)');
    await blur();
    expect(stored()).toBe('hsb(120, 100%, 100%)');
    unmount();
  });

  it('reads the save format from the jsonformsExtended config namespace', async () => {
    const { type, blur, stored, unmount } = render({
      data: {},
      config: { jsonformsExtended: { colorSaveFormat: 'hsb' } },
    });
    await type('#00ff00');
    await blur();
    expect(stored()).toBe('hsb(120, 100%, 100%)');
    unmount();
  });

  it('lets an element option override the configured save format', async () => {
    const { type, blur, stored, unmount } = render({
      data: {},
      config: { jsonformsExtended: { colorSaveFormat: 'hsb' } },
      options: { colorSaveFormat: 'rgb' },
    });
    await type('#00ff00');
    await blur();
    expect(stored()).toBe('rgb(0, 255, 0)');
    unmount();
  });

  it('shows the entry syntax of the configured representation', () => {
    const { input, unmount } = render({
      data: {},
      options: { colorSaveFormat: 'hsb' },
    });
    expect(input()!.placeholder).toBe('hsb(h, s%, b%)');
    unmount();
  });

  it('does not rewrite an existing value on mount', () => {
    // Section 18: "do not normalize existing data solely by mounting the
    // control or changing this option."
    const { stored, input, unmount } = render({
      data: { brand: '#00ff00' },
      options: { colorSaveFormat: 'rgb' },
    });
    expect(input()!.value).toBe('#00ff00');
    expect(stored()).toBe('#00ff00');
    unmount();
  });

  it('leaves an unparseable entry exactly as typed, for validation to report', async () => {
    const { type, blur, stored, input, unmount } = render({
      data: {},
      options: { colorSaveFormat: 'rgb' },
    });
    await type('sea green');
    await blur();
    expect(stored()).toBe('sea green');
    expect(input()!.value).toBe('sea green');
    unmount();
  });

  it('paints the swatch for a value CSS cannot parse itself', () => {
    // `background: hsb(...)` paints nothing.
    const { container, unmount } = render({
      data: { brand: 'hsb(120, 100%, 100%)' },
    });
    const swatch = container.querySelector<HTMLElement>(
      '[aria-label="Choose a color"] span'
    );
    expect(swatch!.style.background).toBe('rgb(0, 255, 0)');
    unmount();
  });
});

describe('three-digit hex and transparency', () => {
  it('quantizes an opaque color to the nearest short-hex value', async () => {
    const { type, blur, stored, unmount } = render({
      data: {},
      options: { colorSaveFormat: 'hex3' },
    });
    await type('#ed5050');
    await blur();
    expect(stored()).toBe('#e55');
    unmount();
  });

  it('refuses a transparent edit instead of silently dropping alpha', async () => {
    const { container, type, blur, stored, unmount } = render({
      data: {},
      options: { colorSaveFormat: 'hex3' },
    });
    await type('#00ff0080');
    await blur();
    // Left as typed - not committed as the opaque `#0f0`.
    expect(stored()).toBe('#00ff0080');
    const guidance = container.querySelector('[data-color-guidance]');
    expect(guidance?.textContent).toContain('Three-digit hex');
    expect(guidance?.getAttribute('role')).toBe('alert');
    unmount();
  });

  it('clears the guidance once an opaque color is entered', async () => {
    const { container, type, blur, unmount } = render({
      data: {},
      options: { colorSaveFormat: 'hex3' },
    });
    await type('#00ff0080');
    await blur();
    expect(container.querySelector('[data-color-guidance]')).toBeTruthy();
    await type('#00ff00');
    await blur();
    expect(container.querySelector('[data-color-guidance]')).toBeNull();
    unmount();
  });
});

describe('colorTextEntry', () => {
  it('replaces the text field with the picker alone when disabled', () => {
    const { container, unmount } = render({
      options: { colorTextEntry: false },
    });
    expect(container.querySelector('input')).toBeNull();
    const trigger = container.querySelector<HTMLButtonElement>(
      '[data-color-trigger]'
    );
    expect(trigger).toBeTruthy();
    expect(trigger!.tagName).toBe('BUTTON');
    unmount();
  });

  it('keeps the picker reachable from the keyboard', () => {
    // Removing text entry removes typing, not keyboard access: the trigger is
    // a real button with an accessible name.
    const { container, unmount } = render({
      options: { colorTextEntry: false },
    });
    const trigger = container.querySelector<HTMLButtonElement>(
      '[data-color-trigger]'
    );
    expect(trigger!.getAttribute('aria-label')).toBe('Choose a color');
    expect(trigger!.tabIndex).toBe(0);
    unmount();
  });

  it("shows the stored text verbatim rather than the picker's reading of it", () => {
    // antd's `showText` would render `#000000` for a value it cannot parse.
    const { container, unmount } = render({
      data: { brand: 'octarine' },
      options: { colorTextEntry: false },
    });
    expect(
      container.querySelector('[data-color-trigger]')!.textContent
    ).toContain('octarine');
    unmount();
  });

  it('keeps the text field when the option is absent or true', () => {
    for (const options of [undefined, { colorTextEntry: true }]) {
      const { container, unmount } = render({ options });
      expect(container.querySelector('input')).toBeTruthy();
      unmount();
    }
  });

  it('can be turned off globally through the config namespace', () => {
    const { container, unmount } = render({
      config: { jsonformsExtended: { colorTextEntry: false } },
    });
    expect(container.querySelector('input')).toBeNull();
    unmount();
  });
});

describe('clearing from the picker', () => {
  const open = async (container: HTMLElement) => {
    const trigger = container.querySelector<HTMLElement>(
      '[aria-label="Choose a color"], [data-color-trigger]'
    )!;
    act(() => {
      trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settle();
    return document.querySelector('.ant-color-picker-panel');
  };

  it('offers a clear affordance inside the open picker', async () => {
    // The only way to clear when text entry is off, so it is not optional.
    const { container, unmount } = render({
      options: { colorTextEntry: false },
    });
    expect(await open(container)).toBeTruthy();
    expect(document.querySelector('.ant-color-picker-clear')).toBeTruthy();
    unmount();
  });

  it('removes the property when the picker is cleared', async () => {
    const { container, stored, unmount } = render({
      options: { colorTextEntry: false },
    });
    await open(container);
    const clear = document.querySelector<HTMLElement>(
      '.ant-color-picker-clear'
    )!;
    act(() => {
      clear.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settle();
    expect(stored()).toBeUndefined();
    unmount();
  });
});

describe('shared control options', () => {
  it('honours an authored placeholder over the format hint', () => {
    const { input, unmount } = render({
      data: {},
      options: { colorSaveFormat: 'hsb', placeholder: 'Pick a brand color' },
    });
    expect(input()!.placeholder).toBe('Pick a brand color');
    unmount();
  });

  it('focuses on mount when the focus option is set', () => {
    const { input, unmount } = render({ options: { focus: true } });
    expect(document.activeElement).toBe(input());
    unmount();
  });

  it('does not focus without the option', () => {
    const { input, unmount } = render();
    expect(document.activeElement).not.toBe(input());
    unmount();
  });

  it('removes both clear affordances when clearable is false', async () => {
    const { container, unmount } = render({ options: { clearable: false } });
    const field = container.querySelector('input')!;
    act(() => {
      field.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    });
    expect(container.querySelector('.ant-input-clear-icon')).toBeNull();
    act(() => {
      container
        .querySelector<HTMLElement>('[aria-label="Choose a color"]')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settle();
    expect(document.querySelector('.ant-color-picker-panel')).toBeTruthy();
    expect(document.querySelector('.ant-color-picker-clear')).toBeNull();
    unmount();
  });
});

describe('the picker panel follows the save format', () => {
  const openPanel = async (container: HTMLElement) => {
    act(() => {
      container
        .querySelector<HTMLElement>(
          '[aria-label="Choose a color"], [data-color-trigger]'
        )!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settle();
  };
  const close = async () => {
    act(() => {
      document.body.dispatchEvent(
        new MouseEvent('mousedown', { bubbles: true })
      );
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settle();
  };
  const selectedFormat = () =>
    document
      .querySelector('.ant-color-picker-format-select .ant-select-content')
      ?.textContent?.trim()
      .toLowerCase();

  it.each([
    ['hex', 'hex'],
    ['hex3', 'hex'],
    ['rgb', 'rgb'],
    ['hsb', 'hsb'],
  ])('opens on the panel for %s', async (saveFormat, panel) => {
    const { container, unmount } = render({
      options: { colorSaveFormat: saveFormat },
    });
    await openPanel(container);
    expect(selectedFormat()).toBe(panel);
    unmount();
  });

  it('returns to the saved format when reopened after a tab switch', async () => {
    // `defaultFormat` only seeds the first render, so a field left on another
    // tab reopened showing channels in a model it does not store.
    const { container, unmount } = render({
      options: { colorSaveFormat: 'rgb' },
    });
    await openPanel(container);
    expect(selectedFormat()).toBe('rgb');

    const select = document.querySelector<HTMLElement>(
      '.ant-color-picker-format-select'
    )!;
    act(() => {
      select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      select.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settle();
    const hexOption = Array.from(
      document.querySelectorAll<HTMLElement>('.ant-select-item-option')
    ).find((option) => option.textContent?.trim().toLowerCase() === 'hex')!;
    act(() => {
      hexOption.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settle();
    expect(selectedFormat()).toBe('hex');

    await close();
    await openPanel(container);
    expect(selectedFormat()).toBe('rgb');
    unmount();
  });
});
