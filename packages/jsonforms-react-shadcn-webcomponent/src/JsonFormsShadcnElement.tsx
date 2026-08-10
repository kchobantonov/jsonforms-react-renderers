import { JsonForms } from '@jsonforms/react';
import type { ValidationMode } from '@jsonforms/core';
import {
  shadcnCells,
  shadcnRenderers,
} from '@chobantonov/jsonforms-react-shadcn-renderers';
import {
  ShadcnRendererSettings,
  createShadcnRendererStyle,
  shadcnExtendedRenderers,
} from '@chobantonov/jsonforms-react-shadcn-extended-renderers';
import {
  ActionEvent,
  HandleActionContext,
} from '@chobantonov/jsonforms-react-extended-renderers';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';

export const JSON_FORMS_SHADCN_TAG = 'jsonforms-react-shadcn';

export type JsonInput = unknown;

export const parseJson = (value: JsonInput) => {
  if (typeof value !== 'string') {
    return value;
  }
  if (value.trim() === '') {
    return undefined;
  }
  return JSON.parse(value);
};

export const parseBoolean = (value: JsonInput) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === '' || value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return undefined;
};

export const parseMode = (value: JsonInput) =>
  value === 'dark' || value === 'light' || value === 'system'
    ? value
    : 'system';

export const createTranslator = (translations: JsonInput, locale = 'en') => {
  const dictionary = parseJson(translations) as any;
  return (id: string, defaultMessage: string | undefined) => {
    const value = dictionary?.[locale]?.[id] ?? dictionary?.[id];
    if (typeof value === 'string') return value;
    if (typeof value?.label === 'string') return value.label;
    return defaultMessage ?? id;
  };
};

type ElementState = {
  data?: JsonInput;
  schema?: JsonInput;
  uischema?: JsonInput;
  uischemas?: JsonInput;
  config?: JsonInput;
  readonly?: JsonInput;
  validationMode?: ValidationMode;
  locale?: string;
  translations?: JsonInput;
  additionalErrors?: JsonInput;
  dark?: JsonInput;
  mode?: JsonInput;
  rtl?: JsonInput;
  customStyle?: string;
  rendererSettings?: JsonInput;
  accentColor?: string;
  borderRadius?: JsonInput;
  density?: ShadcnRendererSettings['density'];
};

const observedAttributes = [
  'data',
  'schema',
  'uischema',
  'uischemas',
  'config',
  'readonly',
  'validation-mode',
  'locale',
  'translations',
  'additional-errors',
  'dark',
  'mode',
  'rtl',
  'custom-style',
  'renderer-settings',
  'accent-color',
  'border-radius',
  'density',
];

const baseStyle = `
:host { display: block; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
*, *::before, *::after { box-sizing: border-box; }
.shadcn-jsonforms-host { display: grid; gap: 12px; --shadcn-jsonforms-radius: 6px; --shadcn-jsonforms-accent: #2563eb; }
.shadcn-jsonforms-host[data-dark='true'] { background: #0f172a; color: #e2e8f0; }
.shadcn-jsonforms-root,
.shadcn-jsonforms-layout { box-sizing: border-box; }
.shadcn-jsonforms-layout { display: flex; gap: 12px; width: 100%; }
.shadcn-jsonforms-layout-column { flex-direction: column; }
.shadcn-jsonforms-layout-row { align-items: flex-start; flex-direction: row; flex-wrap: wrap; }
.shadcn-jsonforms-field { display: grid; gap: 5px; min-width: 220px; }
.shadcn-jsonforms-label { color: #1f2937; font-size: 13px; font-weight: 600; }
.shadcn-jsonforms-input {
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: var(--shadcn-jsonforms-radius, 6px);
  color: #111827;
  font: inherit;
  min-height: 36px;
  padding: 7px 10px;
}
.shadcn-jsonforms-input:focus {
  border-color: var(--shadcn-jsonforms-accent, #2563eb);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--shadcn-jsonforms-accent, #2563eb) 18%, transparent);
  outline: none;
}
.shadcn-jsonforms-description { color: #64748b; font-size: 12px; }
.shadcn-jsonforms-error { color: #b91c1c; font-size: 12px; }
.shadcn-jsonforms-checkbox { align-items: center; display: inline-flex; gap: 8px; }
.shadcn-jsonforms-group,
.shadcn-jsonforms-array,
.shadcn-jsonforms-object {
  border: 1px solid #e2e8f0;
  border-radius: var(--shadcn-jsonforms-radius, 6px);
  display: grid;
  gap: 12px;
  padding: 14px;
}
.shadcn-jsonforms-group > legend,
.shadcn-jsonforms-array h3,
.shadcn-jsonforms-object h3 {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}
.shadcn-jsonforms-array-header { align-items: center; display: flex; justify-content: space-between; }
.shadcn-jsonforms-array-item { border-top: 1px solid #e2e8f0; display: grid; gap: 10px; padding-top: 12px; }
.shadcn-jsonforms-button,
.shadcn-jsonforms-tab {
  background: var(--shadcn-jsonforms-accent, #2563eb);
  border: 0;
  border-radius: var(--shadcn-jsonforms-radius, 6px);
  color: #fff;
  cursor: pointer;
  font: inherit;
  min-height: 34px;
  padding: 7px 12px;
}
.shadcn-jsonforms-button:disabled,
.shadcn-jsonforms-tab:disabled { cursor: not-allowed; opacity: 0.5; }
.shadcn-jsonforms-button-danger { background: #dc2626; justify-self: flex-start; }
.shadcn-jsonforms-tabs { border-bottom: 1px solid #e2e8f0; display: flex; gap: 6px; margin-bottom: 12px; }
.shadcn-jsonforms-tab {
  background: transparent;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  color: #475569;
}
.shadcn-jsonforms-tab[data-active] { background: var(--shadcn-jsonforms-accent, #2563eb); color: #fff; }
.shadcn-jsonforms-static-label { color: #334155; font-weight: 600; }
.shadcn-jsonforms-alert { border: 1px solid #bfdbfe; border-radius: var(--shadcn-jsonforms-radius, 6px); padding: 10px 12px; }
`;

export class JsonFormsShadcnElement extends HTMLElement {
  static get observedAttributes() {
    return observedAttributes;
  }

  private root?: Root;
  private state: ElementState = {
    validationMode: 'ValidateAndShow',
    locale: 'en',
    mode: 'system',
    readonly: false,
    customStyle: '',
  };

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (!this.shadowRoot) return;
    this.root = createRoot(this.shadowRoot);
    this.render();
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = undefined;
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    this.setValue(name, newValue);
  }

  set data(value: JsonInput) {
    this.setValue('data', value);
  }
  set schema(value: JsonInput) {
    this.setValue('schema', value);
  }
  set uischema(value: JsonInput) {
    this.setValue('uischema', value);
  }
  set uischemas(value: JsonInput) {
    this.setValue('uischemas', value);
  }
  set config(value: JsonInput) {
    this.setValue('config', value);
  }
  set readonly(value: JsonInput) {
    this.setValue('readonly', value);
  }
  set validationMode(value: ValidationMode) {
    this.setValue('validationMode', value);
  }
  set locale(value: string) {
    this.setValue('locale', value);
  }
  set translations(value: JsonInput) {
    this.setValue('translations', value);
  }
  set additionalErrors(value: JsonInput) {
    this.setValue('additionalErrors', value);
  }
  set dark(value: JsonInput) {
    this.setValue('dark', value);
  }
  set mode(value: JsonInput) {
    this.setValue('mode', value);
  }
  set rtl(value: JsonInput) {
    this.setValue('rtl', value);
  }
  set customStyle(value: string) {
    this.setValue('customStyle', value);
  }
  set rendererSettings(value: JsonInput) {
    this.setValue('rendererSettings', value);
  }
  set accentColor(value: string) {
    this.setValue('accentColor', value);
  }
  set borderRadius(value: JsonInput) {
    this.setValue('borderRadius', value);
  }
  set density(value: ShadcnRendererSettings['density']) {
    this.setValue('density', value);
  }

  private setValue(name: string, value: JsonInput) {
    const key = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    (this.state as any)[key] = value;
    this.render();
  }

  private emitChange(data: unknown, errors: unknown[]) {
    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { data, errors },
      })
    );
  }

  private emitAction(event: ActionEvent) {
    this.dispatchEvent(
      new CustomEvent('handle-action', {
        bubbles: true,
        composed: true,
        detail: event,
      })
    );
  }

  private render() {
    if (!this.root) return;

    const dark =
      parseBoolean(this.state.dark) ?? parseMode(this.state.mode) === 'dark';
    const rendererSettings = {
      ...((parseJson(this.state.rendererSettings) as ShadcnRendererSettings) ??
        {}),
      accentColor: this.state.accentColor,
      borderRadius:
        typeof this.state.borderRadius === 'string'
          ? Number(this.state.borderRadius)
          : this.state.borderRadius,
      density: this.state.density,
    } as ShadcnRendererSettings;
    const style = createShadcnRendererStyle(rendererSettings, dark);

    this.root.render(
      <>
        <style>{baseStyle}</style>
        <style>{this.state.customStyle ?? ''}</style>
        <div
          className='shadcn-jsonforms-host'
          data-dark={dark ? 'true' : 'false'}
          dir={parseBoolean(this.state.rtl) ? 'rtl' : undefined}
          style={style}
        >
          <slot name='form-header' />
          <HandleActionContext.Provider
            value={(event) => this.emitAction(event)}
          >
            <JsonForms
              data={parseJson(this.state.data)}
              schema={parseJson(this.state.schema) as any}
              uischema={parseJson(this.state.uischema) as any}
              uischemas={parseJson(this.state.uischemas) as any}
              config={{
                ...((parseJson(this.state.config) as Record<string, any>) ??
                  {}),
                readonly: parseBoolean(this.state.readonly),
              }}
              readonly={parseBoolean(this.state.readonly)}
              validationMode={this.state.validationMode}
              renderers={shadcnRenderers.concat(shadcnExtendedRenderers)}
              cells={shadcnCells}
              additionalErrors={parseJson(this.state.additionalErrors) as any}
              i18n={{
                locale: this.state.locale,
                translate: createTranslator(
                  this.state.translations,
                  this.state.locale
                ),
              }}
              onChange={({ data, errors }) => this.emitChange(data, errors)}
            />
          </HandleActionContext.Provider>
          <slot name='form-footer' />
        </div>
      </>
    );
  }
}

export const registerJsonFormsShadcn = (
  tagName: string = JSON_FORMS_SHADCN_TAG
) => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, JsonFormsShadcnElement);
  }
};
