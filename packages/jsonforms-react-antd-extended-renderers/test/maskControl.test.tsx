import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ConfigProvider } from 'antd';
import { JsonForms } from '@jsonforms/react';
import {
  antdCells,
  antdRenderers,
} from '@chobantonov/jsonforms-react-antd-renderers';
import {
  AntdMaskControlRenderer,
  antdMaskControlTester,
} from '../src/renderers/AntdMaskControlRenderer';

afterEach(() => {
  document.body.innerHTML = '';
});

// JsonForms debounces its own onChange by 10ms, so a commit is not visible to
// the test's listener in the tick it was dispatched.
const settle = async (ms = 30) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const setNativeValue = (field: HTMLInputElement, value: string) => {
  // The prototype setter, so React's value tracker sees a change and lets the
  // synthetic `change` through - assigning `field.value` directly would not.
  Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )!.set!.call(field, value);
};

const inputEvent = (inputType: string, data?: string) => {
  const event = new Event('input', { bubbles: true }) as Event &
    Record<string, unknown>;
  // jsdom's InputEvent constructor ignores `inputType`, and the renderer reads
  // it to tell a deletion from an insertion.
  event.inputType = inputType;
  event.data = data;
  return event;
};

const baseSchema = {
  type: 'object',
  properties: { reference: { type: 'string' } },
};

interface RenderOptions {
  data?: Record<string, unknown>;
  options?: Record<string, unknown>;
  config?: Record<string, unknown>;
  schema?: Record<string, unknown>;
}

const render = ({
  data = {},
  options = { mask: '###-###' },
  config,
  schema = baseSchema,
}: RenderOptions = {}) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let latest: any = data;
  let changes = 0;

  const draw = (formData: any) => (
    <ConfigProvider theme={{ token: { motion: false } }}>
      <JsonForms
        data={formData}
        schema={schema as any}
        uischema={
          {
            type: 'Control',
            scope: '#/properties/reference',
            label: 'Reference',
            options,
          } as any
        }
        config={config}
        renderers={[
          ...antdRenderers,
          { tester: antdMaskControlTester, renderer: AntdMaskControlRenderer },
        ]}
        cells={antdCells}
        onChange={({ data: next }) => {
          changes += 1;
          latest = next;
        }}
      />
    </ConfigProvider>
  );

  act(() => root.render(draw(data)));

  const input = () => container.querySelector<HTMLInputElement>('input')!;

  /** One keystroke at the caret, as a browser would deliver it. */
  const press = async (text: string) => {
    for (const char of text) {
      const field = input();
      const before = field.value;
      const at = field.selectionStart ?? before.length;
      const raw = before.slice(0, at) + char + before.slice(at);
      // A browser drops a keystroke that would take the field past its own
      // `maxlength`, and no `input` event is fired. Assigning `value` through
      // the prototype setter ignores the attribute, so without this the tests
      // below could not tell a correct field from one that had wrongly
      // forwarded the schema limit to the DOM.
      const limit = field.getAttribute('maxlength');
      if (limit !== null && raw.length > Number(limit)) {
        continue;
      }
      setNativeValue(field, raw);
      field.setSelectionRange(at + 1, at + 1);
      act(() => {
        field.dispatchEvent(inputEvent('insertText', char));
      });
      await settle();
    }
  };

  const backspace = async () => {
    const field = input();
    const at = field.selectionStart ?? field.value.length;
    setNativeValue(field, field.value.slice(0, at - 1) + field.value.slice(at));
    field.setSelectionRange(at - 1, at - 1);
    act(() => {
      field.dispatchEvent(inputEvent('deleteContentBackward'));
    });
    await settle();
  };

  /**
   * Types into whatever currently holds focus, which is what a keyboard does.
   *
   * `press` re-queries the field every keystroke, so it keeps typing into a
   * control that has been remounted underneath it. A person cannot: once the
   * input is replaced, the keystrokes go to `document.body` and are lost. This
   * helper stops at that point, so the value it leaves behind is the value the
   * user would actually have got.
   */
  const keyboard = async (text: string) => {
    for (const char of text) {
      const field = document.activeElement as HTMLInputElement | null;
      if (!field || field.tagName !== 'INPUT') {
        return;
      }
      const before = field.value;
      const at = field.selectionStart ?? before.length;
      setNativeValue(field, before.slice(0, at) + char + before.slice(at));
      field.setSelectionRange(at + 1, at + 1);
      act(() => {
        field.dispatchEvent(inputEvent('insertText', char));
      });
      await settle();
    }
  };

  const caretTo = (position: number) =>
    input().setSelectionRange(position, position);

  return {
    container,
    input,
    press,
    keyboard,
    backspace,
    caretTo,
    changes: () => changes,
    stored: () => latest.reference,
    rerender: async (next: any) => {
      await act(async () => {
        root.render(draw(next));
      });
      await settle();
    },
    unmount: () => act(() => root.unmount()),
  };
};

describe('selecting the masked string control', () => {
  const context = { rootSchema: baseSchema as any, config: {} };
  const control = (options: Record<string, unknown>, properties?: any) =>
    [
      { type: 'Control', scope: '#/properties/reference', options } as any,
      (properties ? { type: 'object', properties } : baseSchema) as any,
      properties
        ? { rootSchema: { type: 'object', properties }, config: {} }
        : context,
    ] as const;

  it('wins over the plain text control for a string with a mask pattern', () => {
    const [uischema, schema, ctx] = control({ mask: '###-###' });
    expect(antdMaskControlTester(uischema, schema, ctx as any)).toBe(4);
  });

  /*
    The temporal controls take a *boolean* `mask` that turns their own
    format-derived mask off. Selecting on the option's presence - which the
    Svelte families do - makes "mask this less" request a generic mask instead.
  */
  it('ignores the boolean mask option the temporal controls use', () => {
    const [uischema, schema, ctx] = control({ mask: false });
    expect(antdMaskControlTester(uischema, schema, ctx as any)).toBe(-1);
    const [onSchema, s2, c2] = control({ mask: true });
    expect(antdMaskControlTester(onSchema, s2, c2 as any)).toBe(-1);
  });

  it('leaves a string that names its own editor to that editor', () => {
    for (const format of ['date', 'date-time', 'time', 'color', 'password']) {
      const [uischema, schema, ctx] = control(
        { mask: '##/##/####' },
        { reference: { type: 'string', format } }
      );
      expect(antdMaskControlTester(uischema, schema, ctx as any)).toBe(-1);
    }
  });

  it('leaves a UI-selected specialized presentation alone too', () => {
    const [uischema, schema, ctx] = control({
      mask: '##/##/####',
      format: 'date',
    });
    expect(antdMaskControlTester(uischema, schema, ctx as any)).toBe(-1);
  });

  it('does not claim a non-string', () => {
    const [uischema, schema, ctx] = control(
      { mask: '###' },
      {
        reference: { type: 'number' },
      }
    );
    expect(antdMaskControlTester(uischema, schema, ctx as any)).toBe(-1);
  });
});

describe('displaying and storing', () => {
  it('shows a stored value through the mask', () => {
    const { input, unmount } = render({ data: { reference: '123456' } });
    expect(input().value).toBe('123-456');
    unmount();
  });

  it('stores what was typed without the mask literals', async () => {
    const { press, stored, input, unmount } = render();
    await press('123456');
    expect(input().value).toBe('123-456');
    expect(stored()).toBe('123456');
    unmount();
  });

  it('inserts the literal as soon as it is passed', async () => {
    const { press, input, stored, unmount } = render();
    await press('1234');
    expect(input().value).toBe('123-4');
    expect(stored()).toBe('1234');
    unmount();
  });

  it('refuses characters the token does not accept', async () => {
    const { press, input, stored, unmount } = render();
    await press('12a3');
    expect(input().value).toBe('123');
    expect(stored()).toBe('123');
    unmount();
  });

  it('stores the literals when returnMaskedValue is set', async () => {
    const { press, stored, input, unmount } = render({
      options: { mask: '###-###', returnMaskedValue: true },
    });
    await press('123456');
    expect(input().value).toBe('123-456');
    expect(stored()).toBe('123-456');
    unmount();
  });

  it('clears to undefined rather than to an empty string', async () => {
    const { input, backspace, stored, unmount } = render({
      data: { reference: '1' },
    });
    input().setSelectionRange(1, 1);
    await backspace();
    expect(stored()).toBeUndefined();
    unmount();
  });

  it('honours custom tokens from the UI schema', async () => {
    const { press, input, unmount } = render({
      options: { mask: 'HH:MM', tokens: { H: '[0-2]', M: '[0-5]' } },
    });
    await press('1234');
    expect(input().value).toBe('12:34');
    unmount();
  });

  it('fills the literals ahead of the caret when eager', async () => {
    const { press, input, unmount } = render({
      options: { mask: '###-###', eager: true },
    });
    await press('123');
    expect(input().value).toBe('123-');
    unmount();
  });
});

describe('data the mask cannot carry', () => {
  /*
    "Existing data must not be silently normalized solely because the renderer
    is mounted", and section 19 requires it to be shown as it is.
  */
  it('shows it verbatim and writes nothing on mount', async () => {
    const { input, stored, changes, unmount } = render({
      data: { reference: 'PENDING-REVIEW' },
    });
    await settle();
    expect(input().value).toBe('PENDING-REVIEW');
    expect(stored()).toBe('PENDING-REVIEW');
    // JsonForms emits one onChange when the form initializes; the control must
    // not add a second one rewriting the value.
    expect(changes()).toBe(1);
    unmount();
  });

  it('does not truncate a value that is longer than the mask', async () => {
    const { input, stored, unmount } = render({
      data: { reference: '1234567890' },
    });
    await settle();
    expect(input().value).toBe('1234567890');
    expect(stored()).toBe('1234567890');
    unmount();
  });

  it('brings it under the mask once it is edited', async () => {
    const { input, press, stored, unmount } = render({
      data: { reference: 'PENDING' },
    });
    input().setSelectionRange(7, 7);
    await press('1');
    expect(input().value).toBe('1');
    expect(stored()).toBe('1');
    unmount();
  });
});

describe('the length limit', () => {
  const schema = {
    type: 'object',
    properties: { reference: { type: 'string', maxLength: 6 } },
  };

  /*
    The display is seven characters long for six stored digits. Forwarding
    `maxLength` to the input's own `maxlength`, as the neighbouring families do,
    stops the field at six *displayed* characters and makes the sixth digit
    impossible to type.
  */
  it('counts the stored string, so every allowed character can still be typed', async () => {
    const { press, input, stored, unmount } = render({
      schema,
      options: { mask: '###-###', restrict: true },
    });
    await press('123456');
    expect(input().value).toBe('123-456');
    expect(stored()).toBe('123456');
    unmount();
  });

  it('never sets a DOM maxlength, which would count the wrong characters', () => {
    const { input, unmount } = render({
      schema,
      options: { mask: '###-###', restrict: true },
    });
    expect(input().getAttribute('maxlength')).toBeNull();
    unmount();
  });

  it('refuses an edit that would push the stored value over the limit', async () => {
    const shortSchema = {
      type: 'object',
      properties: { reference: { type: 'string', maxLength: 3 } },
    };
    const { press, input, stored, unmount } = render({
      schema: shortSchema,
      options: { mask: '######', restrict: true },
    });
    await press('1234');
    expect(input().value).toBe('123');
    expect(stored()).toBe('123');
    unmount();
  });

  it('lets the value through when restrict is off, for the validator to report', async () => {
    const shortSchema = {
      type: 'object',
      properties: { reference: { type: 'string', maxLength: 3 } },
    };
    const { press, stored, unmount } = render({
      schema: shortSchema,
      options: { mask: '######' },
    });
    await press('1234');
    expect(stored()).toBe('1234');
    unmount();
  });
});

describe('the entry hint', () => {
  it('falls back to the mask itself', () => {
    const { input, unmount } = render();
    expect(input().placeholder).toBe('###-###');
    unmount();
  });

  it('prefers an authored placeholder', () => {
    const { input, unmount } = render({
      options: { mask: '###-###', placeholder: '123-456' },
    });
    expect(input().placeholder).toBe('123-456');
    unmount();
  });

  it('is suppressed by an explicit empty placeholder, as section 18 requires', () => {
    const { input, unmount } = render({
      options: { mask: '###-###', placeholder: '' },
    });
    expect(input().placeholder).toBe('');
    unmount();
  });

  it('offers none for a set of alternative masks, which have no single shape', () => {
    const { input, unmount } = render({
      options: { mask: ['#### ####', '#### #### ####'] },
    });
    expect(input().placeholder).toBe('');
    unmount();
  });
});

describe('the caret', () => {
  it('steps over a literal the mask inserted', async () => {
    const { press, input, unmount } = render();
    await press('1234');
    expect(input().value).toBe('123-4');
    // Typing the fourth digit moved it past the separator rather than leaving
    // it in front of one.
    expect(input().selectionStart).toBe(5);
    unmount();
  });

  it('keeps its place when editing inside the value', async () => {
    const { press, input, caretTo, unmount } = render({
      data: { reference: '123456' },
    });
    expect(input().value).toBe('123-456');
    caretTo(2);
    await press('9');
    // `12|3456` with a 9 typed in becomes `129-345`, and the caret belongs
    // after the 9 - the third character, not back at the second.
    expect(input().value).toBe('129-345');
    expect(input().selectionStart).toBe(3);
    unmount();
  });
});

describe('composition and external replacement', () => {
  /*
    "Masks, normalization, reactive rendering, and delayed updates must not
    overwrite the active draft or prematurely treat it as a finalized value."
  */
  it('leaves an in-progress composition alone and masks it when it ends', async () => {
    const { input, stored, unmount } = render({
      options: { mask: '@@@@' },
    });
    const field = input();
    act(() => {
      field.dispatchEvent(
        new CompositionEvent('compositionstart', { bubbles: true })
      );
    });
    setNativeValue(field, 'ka');
    act(() => {
      field.dispatchEvent(inputEvent('insertCompositionText', 'ka'));
    });
    await settle();
    // Untouched while composing, even though the mask would have accepted it.
    expect(field.value).toBe('ka');

    setNativeValue(field, 'か1');
    act(() => {
      field.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, data: 'か' })
      );
    });
    await settle();
    // Masked only now the session is over: the digit is not a letter token.
    expect(input().value).toBe('');
    expect(stored()).toBeUndefined();
    unmount();
  });

  it('gives up its draft when the host replaces the data', async () => {
    const { press, input, rerender, unmount } = render();
    await press('1234');
    expect(input().value).toBe('123-4');
    await rerender({ reference: '987654' });
    expect(input().value).toBe('987-654');
    unmount();
  });
});

describe('keeping focus while the value is invalid', () => {
  /*
    antd composes the `Form.Item` feedback icon into the input's `suffix`, and
    an antd `Input` with no prefix, suffix or allowClear renders a bare
    `<input>` while one with any of them renders `<span
    class="ant-input-affix-wrapper"><input/></span>`. So the first keystroke
    that makes a field invalid changes the element's position in the tree,
    React unmounts and remounts it, and the caret is gone. antd warns about
    exactly this in development: "dynamic add or remove prefix / suffix will
    make it lose focus caused by dom structure change".

    It bites the masked control first because it commits on every keystroke,
    but it is a property of the shared frame, not of the mask.
  */
  const patternSchema = {
    type: 'object',
    properties: { reference: { type: 'string', pattern: '^[0-9]{6}$' } },
  };

  const focused = () => {
    const { container, input, keyboard, stored, unmount } = render({
      schema: patternSchema,
    });
    const field = input();
    act(() => field.focus());
    expect(document.activeElement).toBe(field);
    return { container, input, keyboard, stored, unmount, field };
  };

  it('does not remount the input when the error appears', async () => {
    const { container, input, keyboard, field, unmount } = focused();
    await keyboard('1');
    // The error really is on screen; without this the test would pass on a
    // form that never validated at all.
    expect(container.querySelector('.ant-form-item-has-error')).toBeTruthy();
    expect(input()).toBe(field);
    unmount();
  });

  it('keeps the caret in the field', async () => {
    const { keyboard, field, unmount } = focused();
    await keyboard('1');
    expect(document.activeElement).toBe(field);
    unmount();
  });

  it('lets typing continue through the invalid stretch to a valid value', async () => {
    // The reported symptom: every intermediate value here fails the pattern,
    // so the field is invalid from the first keystroke until the sixth.
    const { keyboard, stored, unmount } = focused();
    await keyboard('482913');
    expect(stored()).toBe('482913');
    unmount();
  });

  it('keeps the input inside one affix wrapper throughout', async () => {
    const { container, keyboard, unmount } = focused();
    const wrapped = () => !!container.querySelector('.ant-input-affix-wrapper');
    const before = wrapped();
    await keyboard('1');
    expect(wrapped()).toBe(before);
    unmount();
  });
});
