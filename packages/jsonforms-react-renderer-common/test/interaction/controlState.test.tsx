import { createDeleteConfirmation } from '../../src/interaction/createDeleteConfirmation';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { mountHook } from '../support/hooks';
import { useConfirmationState } from '../../src/interaction/useConfirmationState';
import { useClearAffordance } from '../../src/controls/useClearAffordance';
import { useFocus } from '../../src/controls/useFocus';
import { getControlHelp } from '../../src/controls/controlHelp';
import {
  usePreTouchErrors,
  filterErrorsBeforeTouch,
} from '../../src/validation/preTouchErrors';
import {
  saveFormatSatisfies,
  warnOnSaveFormat,
} from '../../src/formats/temporalFormats';

const mounted: { unmount(): void }[] = [];
afterEach(() => {
  mounted.splice(0).forEach((view) => view.unmount());
  vi.restoreAllMocks();
});
const mount = <T,>(hook: () => T) => {
  const view = mountHook(hook);
  mounted.push(view);
  return view;
};

describe('control interaction state', () => {
  it('shows clear only for populated, hovered or focused controls', () => {
    let populated = true;
    const view = mount(() => useClearAffordance(populated));
    expect(view.current.allowClear).toBe(false);
    act(view.current.affordanceProps.onMouseEnter);
    expect(view.current.allowClear).toBe(true);
    act(view.current.affordanceProps.onFocus);
    act(view.current.affordanceProps.onMouseLeave);
    expect(view.current.allowClear).toBe(true);
    act(view.current.affordanceProps.onBlur);
    expect(view.current.allowClear).toBe(false);
    populated = false;
    view.rerender();
    act(view.current.affordanceProps.onMouseEnter);
    expect(view.current.allowClear).toBe(false);
  });
  it('tracks focus independently from data', () => {
    const view = mount(useFocus);
    expect(view.current[0]).toBe(false);
    act(view.current[1]);
    expect(view.current[0]).toBe(true);
    act(view.current[2]);
    expect(view.current[0]).toBe(false);
  });
  it.each(['delete', 'typeChange', 'branchChange'] as const)(
    'confirms %s exactly once and can cancel it',
    (operation) => {
      const view = mount(useConfirmationState);
      const perform = vi.fn();
      const request = {
        operation,
        catalogId: 'mixed',
        discarded: [{ name: 'old' }],
        options: { confirmation: { [operation]: 'always' } },
        perform,
      };
      act(() => view.current.request(request));
      expect(view.current.pending).toBe(request);
      expect(view.current.title).toBeTruthy();
      expect(view.current.message).toBeTruthy();
      act(view.current.close);
      expect(perform).not.toHaveBeenCalled();
      act(view.current.confirm);
      expect(perform).not.toHaveBeenCalled();
      act(() => view.current.request(request));
      act(view.current.confirm);
      act(view.current.confirm);
      expect(perform).toHaveBeenCalledTimes(1);
      expect(view.current.title).toBeUndefined();
    },
  );
  it('performs a scalar delete immediately under complex policy', () => {
    const view = mount(useConfirmationState);
    const perform = vi.fn();
    act(() =>
      view.current.request({
        operation: 'delete',
        catalogId: 'mixed',
        discarded: ['x'],
        perform,
      }),
    );
    expect(perform).toHaveBeenCalledOnce();
    expect(view.current.pending).toBeUndefined();
  });
  it.each([
    [{ visible: false, errors: 'bad' }, true, undefined],
    [{ errors: 'bad', description: 'help' }, false, 'bad'],
    [{ description: 'help' }, false, undefined],
    [{ description: 'help' }, true, 'help'],
    [
      { description: 'help', config: { showUnfocusedDescription: true } },
      false,
      'help',
    ],
    [
      {
        description: 'help',
        config: { showUnfocusedDescription: true },
        uischema: { options: { showUnfocusedDescription: false } },
      },
      false,
      undefined,
    ],
    [{}, true, undefined],
  ])('resolves help %#', (props, focused, expected) =>
    expect(getControlHelp(props, focused)).toBe(expected),
  );
});

describe('pre-touch errors', () => {
  it('touches only on blur and never resets touch after data changes', () => {
    let props = {
      errors: 'required',
      path: 'value',
      config: { enableFilterErrorsBeforeTouch: true },
    };
    const view = mount(() => usePreTouchErrors(props));
    expect(view.current.errors).toBe('');
    act(view.current.onFocus);
    expect(view.current.touched).toBe(false);
    act(view.current.onBlur);
    expect(view.current.errors).toBe('required');
    props = { ...props, errors: '' };
    view.rerender();
    expect(view.current.touched).toBe(true);
    props = { ...props, errors: 'required' };
    view.rerender();
    expect(view.current.errors).toBe('required');
  });
  const error = (keyword: string, path = '/value') => ({
    instancePath: path,
    schemaPath: '#',
    keyword,
    params: {},
    message: keyword,
  });
  it.each([
    { touched: true },
    { appliedOptions: {} },
    { errors: '' },
    { coreErrors: undefined },
    { coreErrors: [error('other')] },
    { coreErrors: [error('required')], translateError: undefined },
  ])('keeps formatted messages when no safe filtering applies %#', (patch) => {
    const input = {
      touched: false,
      errors: 'original',
      path: 'value',
      appliedOptions: {
        enableFilterErrorsBeforeTouch: true,
        filterErrorKeywordsBeforeTouch: ['required'],
      },
      coreErrors: [error('other')],
      translateError: (e: any) => e.message,
      ...patch,
    };
    expect(filterErrorsBeforeTouch(input)).toBe(input.errors);
  });
  it('filters only this control and preserves keywordless host messages', () => {
    expect(
      filterErrorsBeforeTouch({
        touched: false,
        errors: 'original',
        path: 'value',
        appliedOptions: {
          enableFilterErrorsBeforeTouch: true,
          filterErrorKeywordsBeforeTouch: ['required'],
        },
        coreErrors: [
          error('required'),
          error('host'),
          error('required', '/other'),
          error(''),
        ],
        translateError: (e: any) => e.message,
      }),
    ).toBe('host\n');
  });
  it.each([undefined, [], 'required'])(
    'hides all before touch for keyword option %s',
    (keywords) => {
      expect(
        filterErrorsBeforeTouch({
          touched: false,
          errors: 'required',
          path: '',
          appliedOptions: {
            enableFilterErrorsBeforeTouch: true,
            filterErrorKeywordsBeforeTouch: keywords,
          },
          coreErrors: [],
        }),
      ).toBe('');
    },
  );
});

describe('temporal serialization contract', () => {
  it.each([
    ['date', 'YYYY-MM-DD', true],
    ['date', 'M/D/YYYY', false],
    ['time', 'HH:mm:ssZ', true],
    ['time', 'H:mm:ssZ', false],
    ['time', 'HH:mm', false],
    ['date-time', 'YYYY-MM-DD[T]HH:mm:ssZ', true],
    ['date-time', 'YYYY-MM-DD[T]HH:mm:ss', false],
    [undefined, 'anything', true],
    ['custom', 'anything', true],
  ])('checks %s with %s', (format, pattern, valid) =>
    expect(saveFormatSatisfies(format, pattern)).toBe(valid),
  );
  it('warns once for each invalid combination and never for valid formats', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnOnSaveFormat('time', 'H:mm');
    warnOnSaveFormat('time', 'H:mm');
    warnOnSaveFormat('time', 'HH:mm:ssZ');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('temporal.saveFormatInvalid');
  });
});

it('binds collection deletion to the owning catalog and preserves its native dialog and guards', () => {
  const request = vi.fn();
  const useDelete = createDeleteConfirmation(
    () => ({ request, dialog: 'Native confirmation' }),
    'agGrid',
  );
  const view = mount(useDelete);
  const input = {
    discarded: [{ name: 'one' }, { name: 'two' }],
    options: { confirmation: { delete: 'always' } },
    config: { readonly: false },
    perform: vi.fn(),
  };
  act(() => view.current.request(input));
  expect(request).toHaveBeenCalledWith({
    ...input,
    operation: 'delete',
    catalogId: 'agGrid',
  });
  expect(request.mock.calls[0][0].perform).toBe(input.perform);
  expect(view.current.dialog).toBe('Native confirmation');
  expect(input.perform).not.toHaveBeenCalled();
});
