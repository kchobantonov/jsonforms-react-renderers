import { describe, expect, it } from 'vitest';
import { createAjv } from '@jsonforms/core';
import { createFormsAjv } from '@chobantonov/jsonforms-react-extended-renderers';
import examples from '../src/examples';

/*
  Every registered example's schema must compile with the validator the demo
  actually uses.

  This exists because one did not. The `temporal-controls` fixture's `$data`
  bound is rejected by JSON Forms' plain `createAjv()` at **compile** time, and
  that throw happens inside `coreReducer` while the store initialises - so the
  whole demo failed to mount, with a stack that names Ajv and never mentions
  the example. A unit test of the fixture would not have caught it; only
  compiling every schema the way the app does.
*/

const demoAjv = createFormsAjv({ allErrors: true });

/*
  A few of the official examples carry no static schema - they build one at
  runtime - so there is nothing here to compile for them.
*/
const withSchema = examples.filter(
  (example) => example.schema && typeof example.schema === 'object'
);

describe('every example schema compiles', () => {
  it('has schemas to check', () => {
    expect(withSchema.length).toBeGreaterThan(20);
  });

  it.each(withSchema.map((example) => [example.name, example] as const))(
    '%s',
    (_name, example) => {
      expect(() => demoAjv.compile(example.schema as any)).not.toThrow();
    }
  );
});

describe('the validator the demo needs', () => {
  /*
    Pinned so the reason the demo supplies its own Ajv cannot quietly stop
    being true - if it ever compiles under the plain one, the `ajv` prop is
    no longer load-bearing and someone should be told.
  */
  it('is not the plain one, for at least one example', () => {
    const offenders = withSchema.filter((example) => {
      try {
        createAjv().compile(example.schema as any);
        return false;
      } catch {
        return true;
      }
    });
    expect(offenders.map((example) => example.name)).toContain(
      'spec-temporal-controls'
    );
  });
});
