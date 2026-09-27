import { describe, expect, it } from 'vitest';
import {
  EDITOR_DIAGNOSTIC_KEYWORD,
  countBlockingMarkers,
  editorSummaryError,
  pointerFor,
  resolvePropagateErrors,
} from '../src/util/editorDiagnostics';

/*
  The rules an editor's published summary has to follow, section 21.

  All of them are decisions about *what* to publish; the wiring that gets it to
  the form is `additionalErrors.test.tsx`, and the end-to-end behaviour is
  `monacoAdditionalErrors.test.tsx` in the antd-extended package.
*/

describe('which markers count', () => {
  /*
    "Warnings, informational messages, and hints stay inside Monaco; they do
    not contribute to the summary count or block form validity."
    Monaco's severities: Hint 1, Info 2, Warning 4, Error 8.
  */
  it('counts only error severity', () => {
    expect(
      countBlockingMarkers([
        { severity: 8 },
        { severity: 4 },
        { severity: 2 },
        { severity: 1 },
        { severity: 8 },
      ])
    ).toBe(2);
  });

  it('treats an absent marker list as none', () => {
    expect(countBlockingMarkers(undefined)).toBe(0);
    expect(countBlockingMarkers([])).toBe(0);
  });
});

describe('the propagateErrors option', () => {
  /*
    Off unless asked for. The portable contract defaults this to **true**; the
    divergence is deliberate and recorded in adjustment 31 - publishing lets a
    language-service diagnostic block a form, which a host should opt into.
  */
  it('is off by default', () => {
    expect(resolvePropagateErrors(undefined, undefined)).toBe(false);
    expect(resolvePropagateErrors({}, {})).toBe(false);
  });

  it('is read from the element first', () => {
    expect(resolvePropagateErrors({ propagateErrors: true }, {})).toBe(true);
  });

  it('falls back to the namespaced form config', () => {
    expect(
      resolvePropagateErrors(undefined, {
        jsonformsExtended: { propagateErrors: true },
      })
    ).toBe(true);
  });

  it('falls back to the flat form config beneath that', () => {
    expect(resolvePropagateErrors(undefined, { propagateErrors: true })).toBe(
      true
    );
  });

  /* An element may switch it off for one editor in a form that has it on. */
  it('lets an element override the config in either direction', () => {
    expect(
      resolvePropagateErrors(
        { propagateErrors: false },
        { jsonformsExtended: { propagateErrors: true } }
      )
    ).toBe(false);
    expect(
      resolvePropagateErrors(
        { propagateErrors: true },
        { propagateErrors: false }
      )
    ).toBe(true);
  });
});

describe('the published summary', () => {
  const summary = (path: string, errorCount = 3) =>
    editorSummaryError({
      owner: 'editor-1',
      path,
      language: 'json',
      errorCount,
      message: `Code contains ${errorCount} errors.`,
    });

  /* "instancePath is the JSON Pointer to the edited value in form data." */
  it('addresses the edited value, not a UI scope or a text position', () => {
    expect(summary('settings').instancePath).toBe('/settings');
    expect(summary('items.2.code').instancePath).toBe('/items/2/code');
    expect(summary('').instancePath).toBe('');
  });

  it('uses the keyword the specification names', () => {
    expect(summary('settings').keyword).toBe(EDITOR_DIAGNOSTIC_KEYWORD);
  });

  /*
    The owner is the addition to the specification's shape: several renderers
    can own errors at one path, and section 18 requires clearing "only errors
    belonging to the affected owner".
  */
  it('carries its owner, the language and the count', () => {
    expect(summary('settings', 12).params).toEqual({
      source: 'monaco',
      language: 'json',
      errorCount: 12,
      owner: 'editor-1',
    });
  });
});

describe('pointerFor', () => {
  it('converts a JSON Forms path to a JSON Pointer', () => {
    expect(pointerFor('a.b.0.c')).toBe('/a/b/0/c');
  });
});
