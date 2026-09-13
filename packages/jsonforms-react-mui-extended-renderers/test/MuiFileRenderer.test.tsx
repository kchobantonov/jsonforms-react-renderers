import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonForms } from '@jsonforms/react';
import {
  materialCells,
  materialRenderers,
} from '@jsonforms/material-renderers';
import { JsonSchema } from '@jsonforms/core';
import { muiExtendedRenderers, muiFileRendererTester } from '../src';
import { fileSizeLimit } from '../src/util/file';
import {
  schema as exampleSchema,
  uischema as exampleUi,
} from '../../jsonforms-react-demo-common/src/examples/file';

const mount = async (
  schema: any,
  uischema: any,
  data: any = {},
  config = {}
) => {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  const changed = vi.fn();
  const Harness = () => {
    const [value, setValue] = React.useState(data);
    return (
      <JsonForms
        schema={schema}
        uischema={uischema}
        data={value}
        config={config}
        renderers={[...materialRenderers, ...muiExtendedRenderers]}
        cells={materialCells}
        onChange={(event) => {
          setValue(event.data);
          changed(event.data);
        }}
      />
    );
  };
  await act(async () => root.render(<Harness />));
  return {
    container,
    changed,
    cleanup: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
};
const choose = async (input: HTMLInputElement, file?: File) => {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: file ? [file] : [],
  });
  await act(async () =>
    input.dispatchEvent(new Event('change', { bubbles: true }))
  );
};

describe('MUI file renderer', () => {
  it('renders and uploads all three fields in the shared File example', async () => {
    const view = await mount(exampleSchema, exampleUi);
    try {
      const inputs =
        view.container.querySelectorAll<HTMLInputElement>('input[type=file]');
      expect(inputs).toHaveLength(3);
      expect(inputs[0].accept).toBe('image/*');
      const file = new File(['hello'], 'hello world.txt', {
        type: 'text/plain',
      });
      const expected = [
        ['imageDataUri', 'data:text/plain;base64,aGVsbG8='],
        [
          'fileDataUriWithFileName',
          'data:text/plain;filename=hello%20world.txt;base64,aGVsbG8=',
        ],
        ['base64String', 'aGVsbG8='],
      ];
      for (const [index, [key, value]] of expected.entries()) {
        await choose(inputs[index], file);
        await vi.waitFor(() =>
          expect(view.changed.mock.calls.at(-1)?.[0][key]).toBe(value)
        );
      }
      expect(
        view.container.querySelector<HTMLInputElement>('input[type=text]')
          ?.value
      ).toBe('hello world.txt (5 B)');
      await choose(inputs[0]); // Canceling the OS chooser leaves the value alone.
      expect(view.changed.mock.calls.at(-1)?.[0].imageDataUri).toBe(
        expected[0][1]
      );
      await act(async () =>
        view.container
          .querySelector<HTMLButtonElement>('button[aria-label="Clear value"]')!
          .click()
      );
      await vi.waitFor(() =>
        expect(view.changed.mock.calls.at(-1)?.[0].imageDataUri).toBeUndefined()
      );
    } finally {
      await view.cleanup();
    }
  });

  it('opens the chooser by clicking or using the keyboard, but not when clearing', async () => {
    const view = await mount(
      { type: 'string', format: 'binary' },
      { type: 'Control', scope: '#' }
    );
    try {
      const picker =
        view.container.querySelector<HTMLInputElement>('input[type=file]')!;
      const display =
        view.container.querySelector<HTMLInputElement>('input[type=text]')!;
      const click = vi.spyOn(picker, 'click').mockImplementation(() => {});
      await act(async () => display.click());
      expect(click).toHaveBeenCalledTimes(1);
      for (const key of ['Enter', ' ']) {
        await act(async () =>
          display.dispatchEvent(
            new KeyboardEvent('keydown', { key, bubbles: true })
          )
        );
      }
      expect(click).toHaveBeenCalledTimes(3);
      expect(display.readOnly).toBe(true);
      await choose(
        picker,
        new File(['x'.repeat(2048)], 'report.txt', { type: 'text/plain' })
      );
      await vi.waitFor(() => expect(display.value).toBe('report.txt (2 KB)'));
      await act(async () =>
        view.container
          .querySelector<HTMLButtonElement>('button[aria-label="Clear value"]')!
          .click()
      );
      expect(click).toHaveBeenCalledTimes(3);
      await vi.waitFor(() => expect(display.value).toBe(''));
    } finally {
      await view.cleanup();
    }
  });

  it.each(['binary', 'byte'])(
    'outranks text controls for format %s',
    (format) => {
      expect(
        muiFileRendererTester(
          { type: 'Control', scope: '#' },
          { type: 'string', format },
          { rootSchema: {} } as any
        )
      ).toBe(5);
    }
  );
  it('does not claim ordinary strings or URIs', () => {
    for (const schema of [
      { type: 'string' },
      { type: 'string', format: 'uri' },
    ])
      expect(
        muiFileRendererTester(
          { type: 'Control', scope: '#' },
          schema as JsonSchema,
          { rootSchema: {} } as any
        )
      ).toBe(-1);
  });
  it('uses schema-first numeric limits, including zero and exclusive bounds', () => {
    expect(
      fileSizeLimit(
        { formatMaximum: '0' },
        { formatExclusiveMaximum: 12 },
        'Maximum'
      )
    ).toEqual({ value: 0, exclusive: false, key: 'formatMaximum' });
    expect(
      fileSizeLimit(
        { formatExclusiveMinimum: '5' },
        { formatMinimum: 10 },
        'Minimum'
      )
    ).toEqual({ value: 5, exclusive: true, key: 'formatExclusiveMinimum' });
    expect(
      fileSizeLimit(
        {},
        { formatMaximum: 'invalid', formatExclusiveMaximum: '8' },
        'Maximum'
      )
    ).toEqual({ value: 8, exclusive: true, key: 'formatExclusiveMaximum' });
  });
  it.each([
    ['formatMaximum', 4],
    ['formatExclusiveMaximum', 5],
    ['formatMinimum', 6],
    ['formatExclusiveMinimum', 5],
  ])(
    'rejects files outside %s without replacing existing data',
    async (key, limit) => {
      const view = await mount(
        { type: 'string', format: 'byte' },
        { type: 'Control', scope: '#', options: { [key]: limit } },
        'original'
      );
      try {
        await choose(
          view.container.querySelector<HTMLInputElement>('input[type=file]')!,
          new File(['hello'], 'hello.txt')
        );
        expect(view.container.textContent).toContain('File size must be');
        expect(
          view.container
            .querySelector<HTMLInputElement>('input[type=file]')
            ?.getAttribute('aria-invalid')
        ).toBe('true');
        await vi.waitFor(() =>
          expect(view.changed.mock.calls.at(-1)?.[0]).toBe('original')
        );
      } finally {
        await view.cleanup();
      }
    }
  );
  it('uses accept and placeholder options and respects read-only and clearable settings', async () => {
    const view = await mount(
      { type: 'string', format: 'byte' },
      {
        type: 'Control',
        scope: '#',
        options: {
          accept: '.pdf',
          placeholder: 'Attach PDF',
          readonly: true,
          clearable: false,
        },
      },
      'existing'
    );
    try {
      expect(
        view.container.querySelector<HTMLInputElement>('input[type=file]')
          ?.accept
      ).toBe('.pdf');
      expect(
        view.container.querySelector<HTMLInputElement>('input[type=file]')
          ?.disabled
      ).toBe(true);
      expect(
        view.container.querySelector('button[aria-label="Clear value"]')
      ).toBeNull();
    } finally {
      await view.cleanup();
    }
  });

  it('clears a dynamic file value without deleting its property', async () => {
    const view = await mount(
      {
        type: 'object',
        additionalProperties: { type: 'string', contentEncoding: 'base64' },
      },
      { type: 'Control', scope: '#' },
      { attachment: 'aGVsbG8=' }
    );
    try {
      await act(async () =>
        view.container
          .querySelector<HTMLButtonElement>('button[aria-label="Clear value"]')!
          .click()
      );
      await vi.waitFor(() =>
        expect(view.changed.mock.calls.at(-1)?.[0]).toEqual({ attachment: '' })
      );
      expect(view.container.querySelector('input[type=file]')).not.toBeNull();
      expect(
        view.container.querySelector('button[aria-label="Delete attachment"]')
      ).not.toBeNull();
    } finally {
      await view.cleanup();
    }
  });
  it('reports read errors without replacing the stored value', async () => {
    vi.stubGlobal(
      'FileReader',
      class {
        onerror: any;
        abort() {}
        readAsDataURL() {
          this.onerror();
        }
      }
    );
    const view = await mount(
      { type: 'string', format: 'byte' },
      { type: 'Control', scope: '#' },
      'original'
    );
    try {
      await choose(
        view.container.querySelector<HTMLInputElement>('input[type=file]')!,
        new File(['x'], 'failed.txt')
      );
      expect(view.container.textContent).toContain('Failed to process file');
      await vi.waitFor(() =>
        expect(view.changed.mock.calls.at(-1)?.[0]).toBe('original')
      );
    } finally {
      await view.cleanup();
      vi.unstubAllGlobals();
    }
  });

  it('cancels pending reads and ignores late completion', async () => {
    let active: any;
    vi.stubGlobal(
      'FileReader',
      class {
        onload: any;
        onerror: any;
        onabort: any;
        onprogress: any;
        result = 'data:text/plain;base64,bGF0ZQ==';
        abort = vi.fn();
        readAsDataURL() {
          active = this;
        }
      }
    );
    const view = await mount(
      { type: 'string', format: 'byte' },
      { type: 'Control', scope: '#' },
      'original'
    );
    try {
      await choose(
        view.container.querySelector<HTMLInputElement>('input[type=file]')!,
        new File(['late'], 'late.txt')
      );
      expect(document.querySelector('[role=dialog]')).not.toBeNull();
      await act(async () =>
        active.onprogress({ lengthComputable: true, loaded: 2, total: 4 })
      );
      expect(
        document
          .querySelector('[role=progressbar]')
          ?.getAttribute('aria-valuenow')
      ).toBe('50');
      await act(async () =>
        Array.from(document.querySelectorAll('button'))
          .find((button) => button.textContent === 'Cancel')!
          .click()
      );
      expect(active.abort).toHaveBeenCalled();
      await act(async () => active.onload());
      await vi.waitFor(() =>
        expect(view.changed.mock.calls.at(-1)?.[0]).toBe('original')
      );
    } finally {
      await view.cleanup();
      vi.unstubAllGlobals();
    }
  });
});
