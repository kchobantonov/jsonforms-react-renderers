/**
 * Where a JSON Forms `config` key belongs, by origin. See Adjustment 1 in
 * `client/docs/jsonforms-extended-ui-model-adjustments.md`.
 *
 * - Core, Material or Vuetify convention -> top-level config key.
 * - Portable project extension -> under {@link JSONFORMS_EXTENDED_CONFIG_KEY}.
 * - JSON Forms React Renderers-only, outside the portable model -> under {@link JSONFORMS_CONFIG_KEY}.
 *
 * Per-element `uischema.options` stay flat in every case: `variant` is a
 * reserved dispatch input, core's `optionIs` tester reads a flat option, and
 * the specification's `confirmation` example resolves element options over a
 * namespaced config default.
 *
 * Read these namespaces through the constants rather than writing the string,
 * so a rename is one edit here. JSON cannot reference a constant, so authored
 * schemas, config documents and fixtures spell the key literally - which makes
 * a rename a breaking change to those documents, not just a constant edit.
 */
export const JSONFORMS_EXTENDED_CONFIG_KEY = 'jsonformsExtended';

/** Namespace for settings that exist only because of JSON Forms React Renderers's product. */
export const JSONFORMS_CONFIG_KEY = 'jsonforms-react-renderers';

const namespace = (
  config: unknown,
  key: string
): Record<string, unknown> | undefined => {
  if (!config || typeof config !== 'object') {
    return undefined;
  }
  const value = (config as Record<string, unknown>)[key];
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
};

/** The `jsonformsExtended` block of a config object, if it has one. */
export const extendedConfig = (
  config: unknown
): Record<string, unknown> | undefined =>
  namespace(config, JSONFORMS_EXTENDED_CONFIG_KEY);

/**
 * Resolves a project-extension option: the element's flat `options.<name>`,
 * then `config.<namespace>.<name>`, then the caller's default.
 *
 * Only `undefined` falls through. An explicit `false`, `0` or `''` at a more
 * specific level is a real override, as section 5 of the specification
 * requires - truthiness-based fallback would silently discard it.
 */
export const resolveExtendedOption = <T>(
  options: unknown,
  config: unknown,
  name: string,
  fallback: T,
  configKey: string = JSONFORMS_EXTENDED_CONFIG_KEY
): T => {
  const local =
    options && typeof options === 'object'
      ? (options as Record<string, unknown>)[name]
      : undefined;
  if (local !== undefined) {
    return local as T;
  }
  const global = namespace(config, configKey)?.[name];
  return global !== undefined ? (global as T) : fallback;
};
