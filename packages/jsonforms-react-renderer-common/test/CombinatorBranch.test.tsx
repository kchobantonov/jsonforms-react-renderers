import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JsonFormsContext, useJsonForms } from '@jsonforms/react';
import { expect, it, vi } from 'vitest';
import { CombinatorBranch } from '../src/CombinatorBranch';

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
