import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFormsAjv } from '../src/core/ajv';
import { ajvLocalizers } from '../src/core/ajvI18n/localizers';
import { unwrapErrorMessageErrors } from '../src/core/ajvI18n';

/*
  The extended validator profile, ported from the Vue 2 `common` package.

  Four capabilities, each of which a schema can depend on so hard that losing
  it is a compile error rather than a downgrade: the extra keywords, the
  extended `transform`, schema-authored `errorMessage`, and localized messages.
*/

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the extended keywords', () => {
  /* `ajv-keywords` itself - absent from JSON Forms' plain factory. */
  it('registers ajv-keywords', () => {
    const ajv = createFormsAjv();
    const validate = ajv.compile({
      type: 'object',
      properties: { a: { type: 'number' } },
      required: ['a'],
      // `select`/`selectCases` and `typeof` come from ajv-keywords
      allRequired: true,
    } as never);
    expect(validate({ a: 1 })).toBe(true);
    expect(validate({})).toBe(false);
  });

  /*
    Worth an assertion of its own, because the failure mode is the argument
    for the default. JSON Forms' factory sets `strictSchema: false`, so an
    unrecognised keyword is **silently ignored**: the schema still compiles,
    it simply stops enforcing, and the transform stops running. Nothing
    throws and nothing is logged.
  */
  it('fails silently when switched off, which is why it defaults on', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const ajv = createFormsAjv({ extendedKeywords: false });
    const schema = {
      type: 'object',
      properties: { a: { type: 'string', transform: ['toUpperCase'] } },
      allRequired: true,
    };

    // Compiles anyway - no throw, which is the trap.
    const validate = ajv.compile(schema as never);
    expect(warn).not.toHaveBeenCalled();

    // And then enforces nothing: `allRequired` is gone...
    expect(validate({})).toBe(true);
    // ...and the value is not transformed.
    const data: Record<string, unknown> = { a: 'x' };
    validate(data);
    expect(data.a).toBe('x');

    // With the keywords on, the same schema does both.
    const strict = createFormsAjv();
    const enforcing = strict.compile(schema as never);
    expect(enforcing({})).toBe(false);
    const transformed: Record<string, unknown> = { a: 'x' };
    enforcing(transformed);
    expect(transformed.a).toBe('X');
  });
});

describe('the extended transform', () => {
  const run = (transformations: string[], value: string) => {
    const ajv = createFormsAjv();
    const validate = ajv.compile({
      type: 'object',
      properties: { a: { type: 'string', transform: transformations } },
    } as never);
    const data: Record<string, unknown> = { a: value };
    validate(data);
    return data.a;
  };

  /* The ones ajv-keywords already had, so replacing its keyword lost nothing. */
  it.each([
    [['trim'], '  x  ', 'x'],
    [['toLowerCase'], 'AB', 'ab'],
    [['toUpperCase'], 'ab', 'AB'],
    [['trimStart'], '  x', 'x'],
    [['trimEnd'], 'x  ', 'x'],
  ])('keeps %s', (names, input, expected) => {
    expect(run(names as string[], input)).toBe(expected);
  });

  /*
    The two the replacement exists for. `ajv-keywords`' transform table is a
    module constant with no registration hook, so these are only reachable by
    removing its keyword and registering ours.
  */
  it('adds capitalize', () => {
    expect(run(['capitalize'], 'hello world')).toBe('Hello world');
  });

  it('adds startCase', () => {
    expect(run(['startCase'], 'hello world')).toBe('Hello World');
  });

  it('applies transformations in order', () => {
    expect(run(['trim', 'capitalize'], '  hello  ')).toBe('Hello');
  });

  /* It mutates the data, which is the point and is easy to lose in a refactor. */
  it('writes the transformed value back into the data', () => {
    const ajv = createFormsAjv();
    const validate = ajv.compile({
      type: 'object',
      properties: { a: { type: 'string', transform: ['toUpperCase'] } },
    } as never);
    const data = { a: 'x' };
    validate(data);
    expect(data.a).toBe('X');
  });
});

describe('the extra dynamic defaults', () => {
  const defaulted = (spec: unknown) => {
    const ajv = createFormsAjv();
    const validate = ajv.compile({
      type: 'object',
      properties: { a: { type: 'string' } },
      dynamicDefaults: { a: spec },
    } as never);
    const data: Record<string, unknown> = {};
    validate(data);
    return data.a;
  };

  it('offsets a date by an ISO duration', () => {
    const today = defaulted({ func: 'date', args: {} }) as string;
    const tomorrow = defaulted({
      func: 'date',
      args: { duration: 'P1D' },
    }) as string;
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(tomorrow).getTime() - new Date(today).getTime()).toBe(
      24 * 60 * 60 * 1000
    );
  });

  /*
    The original spells it `substract`, so every schema written against the
    Vue 2 stack does too. Both spellings work; neither is enshrined as the
    only one.
  */
  it.each(['subtract', 'substract'])('accepts op: %s', (op) => {
    const today = defaulted({ func: 'date', args: {} }) as string;
    const yesterday = defaulted({
      func: 'date',
      args: { duration: 'P1D', op },
    }) as string;
    expect(new Date(today).getTime() - new Date(yesterday).getTime()).toBe(
      24 * 60 * 60 * 1000
    );
  });

  it('offsets from a supplied date rather than now', () => {
    expect(
      defaulted({ func: 'date', args: { date: '2024-03-01', duration: 'P1D' } })
    ).toBe('2024-03-02');
  });

  it('produces a time and a date-time', () => {
    expect(defaulted({ func: 'time', args: {} })).toMatch(
      /^\d{2}:\d{2}:\d{2}\.\d{3}$/
    );
    expect(defaulted({ func: 'datetime', args: {} })).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/
    );
  });

  it('reads one unit of the offset date', () => {
    const ajv = createFormsAjv();
    const validate = ajv.compile({
      type: 'object',
      properties: { a: { type: 'number' } },
      dynamicDefaults: {
        a: { func: 'dateUnit', args: { date: '2024-03-01', unit: 'year' } },
      },
    } as never);
    const data: Record<string, unknown> = {};
    validate(data);
    expect(data.a).toBe(2024);
  });

  it('reads a query parameter', () => {
    const ajv = createFormsAjv();
    const validate = ajv.compile({
      type: 'object',
      properties: { a: { type: 'string' } },
      dynamicDefaults: { a: { func: 'searchParams', args: { param: 'ref' } } },
    } as never);
    const data: Record<string, unknown> = {};
    validate(data);
    // jsdom's default location carries no query, so this is the absent case:
    // it must produce nothing rather than throwing.
    expect(data.a).toBeUndefined();
  });
});

describe('the dynamic default that compiles a function', () => {
  const withDynamic = (allowScriptEvaluation: boolean) => {
    const ajv = createFormsAjv({ allowScriptEvaluation });
    const validate = ajv.compile({
      type: 'object',
      properties: { a: { type: 'number' } },
      dynamicDefaults: {
        a: {
          func: 'dynamic',
          args: { func: '(args) => args.value', value: 7 },
        },
      },
    } as never);
    const data: Record<string, unknown> = {};
    validate(data);
    return data.a;
  };

  /*
    The Vue 2 original compiles this unconditionally. A schema is data and can
    arrive with the form, so compiling a string out of it is the capability
    section 14 requires permission for - the same gate the template engines
    and `Button.script` already sit behind.
  */
  it('is refused without permission, and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(withDynamic(false)).toBeUndefined();
    expect(warn.mock.calls.map((c) => String(c[0])).join('\n')).toContain(
      'dynamicDefaults.evaluationDisabled'
    );
  });

  it('runs when the host has granted it', () => {
    expect(withDynamic(true)).toBe(7);
  });
});

describe('schema-authored error messages', () => {
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 3 },
      age: { type: 'number', minimum: 18 },
    },
    required: ['name'],
    errorMessage: {
      properties: {
        name: 'nameTooShort',
        age: 'tooYoung',
      },
    },
  };

  it('replaces the validator wording with the schema s own', () => {
    const ajv = createFormsAjv();
    const validate = ajv.compile(schema as never);
    validate({ name: 'ab', age: 1 });
    const messages = (validate.errors ?? []).map((e) => e.message);
    expect(messages).toContain('nameTooShort');
    expect(messages).toContain('tooYoung');
  });

  /*
    The reason unwrapping matters: ajv-errors collapses the covered failures
    into one error at the *object's* path, and JSON Forms maps errors to
    controls by path - so without unwrapping neither field shows anything.
  */
  it('keeps each message on the property it belongs to', () => {
    const ajv = createFormsAjv();
    const validate = ajv.compile(schema as never);
    validate({ name: 'ab', age: 1 });
    const byPath = Object.fromEntries(
      (validate.errors ?? []).map((e) => [e.instancePath, e.message])
    );
    expect(byPath['/name']).toBe('nameTooShort');
    expect(byPath['/age']).toBe('tooYoung');
  });

  it('can be switched off', () => {
    const ajv = createFormsAjv({ errorMessages: false });
    const validate = ajv.compile(schema as never);
    validate({ name: 'ab' });
    expect((validate.errors ?? []).map((e) => e.message)).not.toContain(
      'nameTooShort'
    );
  });

  /* ajv-errors needs allErrors; refusing loudly beats throwing at startup. */
  it('warns rather than throwing when allErrors is off', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(() => createFormsAjv({ allErrors: false })).not.toThrow();
    expect(warn.mock.calls.map((c) => String(c[0])).join('\n')).toContain(
      'ajv.errorMessagesNeedAllErrors'
    );
  });

  /* A message is treated as a translation key first, and as text if unresolved. */
  it('translates the message through the form s catalog', () => {
    const ajv = createFormsAjv({
      i18n: () => ({
        locale: 'en',
        translate: ((key: string, fallback?: string) =>
          key === 'error.errorMessage.nameTooShort'
            ? 'Please give a longer name.'
            : fallback) as never,
      }),
    });
    const validate = ajv.compile(schema as never);
    validate({ name: 'ab' });
    expect((validate.errors ?? []).map((e) => e.message)).toContain(
      'Please give a longer name.'
    );
  });

  it('uses the message literally when the catalog does not resolve it', () => {
    const ajv = createFormsAjv({
      i18n: () => ({
        locale: 'en',
        translate: ((_key: string, fallback?: string) => fallback) as never,
      }),
    });
    const validate = ajv.compile(schema as never);
    validate({ name: 'ab' });
    expect((validate.errors ?? []).map((e) => e.message)).toContain(
      'nameTooShort'
    );
  });
});

describe('localized validator messages', () => {
  const schema = {
    type: 'object',
    properties: { a: { type: 'number', minimum: 5 } },
  };

  const ajvFor = (locale: string) =>
    createFormsAjv({
      i18n: () => ({
        locale,
        translate: ((_key: string, fallback?: string) => fallback) as never,
      }),
      localizers: ajvLocalizers,
    });

  it('leaves English alone', () => {
    const validate = ajvFor('en').compile(schema as never);
    validate({ a: 1 });
    expect(validate.errors?.[0].message).toContain('>= 5');
  });

  it('translates into a shipped language', () => {
    const validate = ajvFor('de').compile(schema as never);
    validate({ a: 1 });
    expect(validate.errors?.[0].message).not.toContain('must be');
    expect(validate.errors?.[0].message).toBeTruthy();
  });

  /* ajv-i18n ships no Bulgarian; this package carries it. */
  it('translates into Bulgarian, which ajv-i18n does not ship', () => {
    const validate = ajvFor('bg').compile(schema as never);
    validate({ a: 1 });
    expect(validate.errors?.[0].message).toMatch(/[Ѐ-ӿ]/);
  });

  /* The shipped bg `required` interpolates an untranslated property name. */
  it('overrides the Bulgarian required message', () => {
    const validate = ajvFor('bg').compile({
      type: 'object',
      properties: { a: { type: 'string' } },
      required: ['a'],
    } as never);
    validate({});
    expect(validate.errors?.[0].message).toBe('полето е задължително');
  });

  it('falls back from a regional locale to its language', () => {
    const validate = ajvFor('bg-BG').compile(schema as never);
    validate({ a: 1 });
    expect(validate.errors?.[0].message).toMatch(/[Ѐ-ӿ]/);
  });

  it('leaves messages alone for a language nobody supplied', () => {
    const validate = ajvFor('xx').compile(schema as never);
    validate({ a: 1 });
    expect(validate.errors?.[0].message).toContain('>= 5');
  });

  /*
    A localizer must not overwrite a message the schema chose - the author has
    already replaced the validator's wording for that keyword.
  */
  it('does not localize a schema-authored message', () => {
    const validate = ajvFor('bg').compile({
      type: 'object',
      properties: { a: { type: 'number', minimum: 5 } },
      errorMessage: { properties: { a: 'tooSmall' } },
    } as never);
    validate({ a: 1 });
    expect(validate.errors?.map((e) => e.message)).toContain('tooSmall');
  });

  /* The locale is read per validation, so one validator serves many. */
  it('follows a locale change without recompiling', () => {
    let locale = 'en';
    const ajv = createFormsAjv({
      i18n: () => ({
        locale,
        translate: ((_key: string, fallback?: string) => fallback) as never,
      }),
      localizers: ajvLocalizers,
    });
    const validate = ajv.compile(schema as never);

    validate({ a: 1 });
    expect(validate.errors?.[0].message).toContain('>= 5');

    locale = 'bg';
    validate({ a: 1 });
    expect(validate.errors?.[0].message).toMatch(/[Ѐ-ӿ]/);
  });
});

describe('unwrapErrorMessageErrors', () => {
  it('tolerates an empty or absent list', () => {
    expect(unwrapErrorMessageErrors(undefined)).toEqual([]);
    expect(unwrapErrorMessageErrors([])).toEqual([]);
  });

  it('leaves ordinary errors untouched', () => {
    const errors = [
      { keyword: 'minimum', instancePath: '/a', message: 'x' },
    ] as never;
    expect(unwrapErrorMessageErrors(errors)).toEqual(errors);
  });
});
