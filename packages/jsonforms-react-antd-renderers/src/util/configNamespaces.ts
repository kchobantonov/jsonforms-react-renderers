/**
 * Namespace for this project's own configuration, per Adjustment 1 in
 * `client/docs/jsonforms-extended-ui-model-adjustments.md`: core, Material and
 * Vuetify conventions stay at the top level of `config`, project extensions go
 * under this key, and per-element `uischema.options` stay flat.
 *
 * `@chobantonov/jsonforms-react-extended-renderers` declares the same constant.
 * The two packages are siblings with no shared base, and depending on that one
 * from here would pull ag-grid, Monaco and sucrase into the base renderer set
 * for a single string. The literal is a wire format that authored JSON spells
 * out anyway, so the duplication is in the code only - and
 * `registry.test.ts` in the antd-extended package, which can see both, fails
 * if they ever drift.
 */
export const JSONFORMS_EXTENDED_CONFIG_KEY = 'jsonformsExtended';

/** Namespace for settings that exist only because of JSON Forms React Renderers's product. */
export const JSONFORMS_CONFIG_KEY = 'jsonforms-react-renderers';
