import type { ErrorObject } from 'ajv';
import { extendedConfig } from './configNamespaces';

/**
 * The one summary error an editor publishes, and when it publishes it.
 *
 * Section 21: "publish **at most one summary additionalError per editor
 * instance**, regardless of the number of blocking diagnostics. Publish none
 * when that editor has no error-level diagnostics."
 */

/** The keyword the specification names for this error. */
export const EDITOR_DIAGNOSTIC_KEYWORD = 'editor.language';

/**
 * Monaco's `MarkerSeverity.Error`.
 *
 * A plain number rather than an import: `monaco-editor` is loaded as a chunk
 * by `@monaco-editor/react`, and importing the enum for one constant would
 * pull the whole editor into any bundle that touches this module. The values
 * are part of Monaco's public API - Hint 1, Info 2, Warning 4, Error 8.
 */
export const MONACO_SEVERITY_ERROR = 8;

export interface EditorMarker {
  severity?: number;
  message?: string;
}

/** Only error-level markers count. "Warnings … stay inside Monaco." */
export const countBlockingMarkers = (markers: EditorMarker[] | undefined) =>
  (markers ?? []).filter(
    (marker) => (marker?.severity ?? 0) >= MONACO_SEVERITY_ERROR
  ).length;

/**
 * Whether this editor publishes into the form's additional errors.
 *
 * Resolution is element option, then the namespaced form config, then the flat
 * one - the order every other option in this renderer set uses.
 *
 * **The default is `false`, and the portable contract says `true`.** That is a
 * deliberate divergence, recorded in adjustment 31: publishing turns a
 * language-service diagnostic into something that can block a form, and this
 * project's position is that a host opts into that rather than inheriting it.
 * A form that wants the portable default sets the option once, form-wide.
 */
export const resolvePropagateErrors = (
  elementOptions: Record<string, unknown> | undefined,
  config: unknown
): boolean => {
  const own = elementOptions?.['propagateErrors'];
  if (own !== undefined) {
    return own === true;
  }
  const namespaced = extendedConfig(config) as
    | { propagateErrors?: unknown }
    | undefined;
  if (namespaced?.propagateErrors !== undefined) {
    return namespaced.propagateErrors === true;
  }
  const flat = (config as { propagateErrors?: unknown } | undefined)
    ?.propagateErrors;
  return flat === true;
};

/** `a.b.0.c` - JSON Forms' path spelling - as the JSON Pointer `/a/b/0/c`. */
export const pointerFor = (path: string): string =>
  path ? `/${path.split('.').join('/')}` : '';

export interface EditorSummaryInput {
  /** Unique per editor instance, so two editors never overwrite each other. */
  owner: string;
  path: string;
  language: string | undefined;
  errorCount: number;
  message: string;
}

/**
 * The summary, in the AJV-compatible shape the specification gives.
 *
 * `params.owner` is the addition: several renderers may own errors at one
 * path, so the host's registry needs to know whose is whose. Section 18 wants
 * that metadata "in runtime integration state, outside business data and the
 * authored UI schema", which an error's `params` is.
 */
export const editorSummaryError = ({
  owner,
  path,
  language,
  errorCount,
  message,
}: EditorSummaryInput): ErrorObject =>
  ({
    instancePath: pointerFor(path),
    schemaPath: '',
    keyword: EDITOR_DIAGNOSTIC_KEYWORD,
    message,
    params: {
      source: 'monaco',
      language,
      errorCount,
      owner,
    },
  } as ErrorObject);
