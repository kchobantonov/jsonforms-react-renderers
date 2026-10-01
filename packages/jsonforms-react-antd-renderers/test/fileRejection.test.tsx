import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { Upload } from 'antd';
import { AntdFile } from '../src/antd-controls/AntdFile';

const upload = vi.hoisted(() => ({ props: undefined as any }));
vi.mock('antd', async importOriginal => {
  const actual = await importOriginal<typeof import('antd')>();
  return { ...actual, Upload: Object.assign((props: any) => { upload.props = props; return null; }, { LIST_IGNORE: actual.Upload.LIST_IGNORE }) };
});

const schema = {
  type: 'string',
  contentEncoding: 'base64',
  formatMaximum: 1024,
  formatMinimum: 10,
} as any;

const uischema = { type: 'Control', scope: '#' } as any;

describe('file size rejection', () => {
  const renderControl = (handleChange = vi.fn()) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
      root.render(
        <AntdFile
          data='previously-committed-base64'
          schema={schema}
          uischema={uischema}
          path='attachment'
          handleChange={handleChange}
          enabled
          t={(_k: string, fallback: string) => fallback}
          {...({
            isValid: true,
            rootSchema: schema,
            errors: '',
            id: 'f',
            visible: true,
          } as any)}
        />
      )
    );
    return {
      container,
      get props() {
        return upload.props;
      },
      handleChange,
      unmount: () => {
        act(() => root.unmount());
        container.remove();
      },
    };
  };

  it('rejects an oversized file without touching the committed value', () => {
    const c = renderControl();
    let result: unknown;
    act(() => {
      result = c.props.beforeUpload({ size: 5000, name: 'big.json' });
    });
    // Not added to the list, so customRequest never runs.
    expect(result).toBe(Upload.LIST_IGNORE);
    // The bug: this used to be called with undefined, wiping a good value.
    expect(c.handleChange).not.toHaveBeenCalled();
    c.unmount();
  });

  it('rejects an undersized file the same way', () => {
    const c = renderControl();
    let result: unknown;
    act(() => {
      result = c.props.beforeUpload({ size: 2, name: 'tiny.json' });
    });
    expect(result).toBe(Upload.LIST_IGNORE);
    expect(c.handleChange).not.toHaveBeenCalled();
    c.unmount();
  });

  it('names the rejected file, so it cannot read as the kept one', () => {
    // The committed attachment is still listed above this message. Without the
    // name, "size should be less than 1 MB" looks like an error about *that*
    // file rather than the one that was turned away.
    const c = renderControl();
    act(() => {
      c.props.beforeUpload({ size: 5000, name: 'dev-big.json' });
    });
    const alert = c.container.querySelector('[data-file-rejection]');
    expect(alert).toBeTruthy();
    expect(alert!.getAttribute('role')).toBe('alert');
    expect(alert!.textContent).toContain('dev-big.json');
    expect(alert!.textContent).toContain('was not attached');
    expect(alert!.textContent).toContain('size should be less than');
    c.unmount();
  });

  it('falls back to the bare reason when the platform gives no name', () => {
    const c = renderControl();
    act(() => {
      c.props.beforeUpload({ size: 5000 });
    });
    const alert = c.container.querySelector('[data-file-rejection]')!;
    expect(alert.textContent).toContain('size should be less than');
    expect(alert.textContent).not.toContain('was not attached');
    c.unmount();
  });

  it('drops the rejection once a good file is chosen', () => {
    const c = renderControl();
    act(() => {
      c.props.beforeUpload({ size: 5000, name: 'big.json' });
    });
    expect(c.container.querySelector('[data-file-rejection]')).toBeTruthy();
    act(() => {
      c.props.beforeUpload({ size: 500, name: 'ok.json' });
    });
    expect(c.container.querySelector('[data-file-rejection]')).toBeNull();
    c.unmount();
  });

  it('accepts a file inside the bounds', () => {
    const c = renderControl();
    let result: unknown;
    act(() => {
      result = c.props.beforeUpload({ size: 500, name: 'ok.json' });
    });
    expect(result).toBe(true);
    expect(c.container.querySelector('[data-file-rejection]')).toBeNull();
    c.unmount();
  });

  it('still clears the value when the user removes the file', () => {
    const c = renderControl();
    act(() => {
      c.props.onRemove();
    });
    expect(c.handleChange).toHaveBeenCalledWith('attachment', undefined);
    c.unmount();
  });

  it('keeps the committed value when reading a new file fails', () => {
    const c = renderControl();
    const onError = vi.fn();
    act(() => {
      c.props.beforeUpload({ size: 500, name: 'ok.json' });
    });
    return act(async () => {
      await c.props.customRequest({
        file: { size: 500 },
        onSuccess: vi.fn(),
        onError,
        onProgress: vi.fn(),
      });
    }).then(() => {
      // FileReader in jsdom rejects a plain object, so this exercises the
      // conversion-failure path.
      expect(onError).toHaveBeenCalled();
      expect(c.handleChange).not.toHaveBeenCalled();
      c.unmount();
    });
  });
});
