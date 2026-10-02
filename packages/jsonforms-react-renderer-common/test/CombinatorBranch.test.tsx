import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonFormsContext, useJsonForms } from '@jsonforms/react';
import { expect, it, vi } from 'vitest';
import { CombinatorBranch, mergeBranchErrors } from '../src/CombinatorBranch';

it('honors control overrides, skips disabled work and reuses compilation', () => {
  const validate = vi.fn(() => true);
  const compile = vi.fn(() => validate);
  const ajv = { compile };
  const schema = { type: 'string' };
  const host = document.createElement('div');
  const root = createRoot(host);
  const Probe = () => <span>{useJsonForms().core?.errors?.length}</span>;
  const render = (
    global: boolean | undefined,
    local: boolean | undefined,
    data = 'a'
  ) =>
    act(() =>
      root.render(
        <JsonFormsContext.Provider
          value={
            {
              core: { data, errors: [], ajv },
              config: { validateActiveBranch: global },
            } as any
          }
        >
          <CombinatorBranch
            schema={schema}
            path=''
            options={{ validateActiveBranch: local }}
          >
            <Probe />
          </CombinatorBranch>
        </JsonFormsContext.Provider>
      )
    );
  try {
    render(false, undefined);
    expect(compile).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
    render(false, true);
    expect(compile).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledTimes(1);
    render(false, true);
    expect(compile).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledTimes(1);
    render(false, true, 'b');
    expect(compile).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledTimes(2);
    render(true, false);
    expect(validate).toHaveBeenCalledTimes(2);
    render(undefined, undefined);
    expect(validate).toHaveBeenCalledTimes(3);
  } finally {
    act(() => root.unmount());
  }
});

it('deduplicates equivalent branch feedback but retains distinct targets and constraints', () => {
  const required = (schemaPath: string, missingProperty = 'name') => ({
    keyword: 'required',
    instancePath: '/tree/children/0',
    schemaPath,
    params: { missingProperty },
    message: 'is a required property',
  });
  const errors = mergeBranchErrors(
    [
      required('#/definitions/file/required'),
      required('#/definitions/folder/required'),
    ],
    [
      required('#/required'),
      required('#/required', 'kind'),
      { ...required('#/required'), instancePath: '/tree/children/1' },
      {
        keyword: 'minLength',
        instancePath: '/tree/children/0/name',
        schemaPath: '#/minLength',
        params: { limit: 2 },
        message: 'too short',
      },
      {
        keyword: 'minLength',
        instancePath: '/tree/children/0/name',
        schemaPath: '#/minLength',
        params: { limit: 5 },
        message: 'too short',
      },
    ]
  );
  expect(errors).toHaveLength(5);
  expect(errors[0].schemaPath).toBe('#/definitions/file/required');
});
