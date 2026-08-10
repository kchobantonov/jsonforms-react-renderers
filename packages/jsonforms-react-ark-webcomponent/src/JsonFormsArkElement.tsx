import { JsonForms } from '@jsonforms/react';
import type { ValidationMode } from '@jsonforms/core';
import {
  arkCells,
  arkRenderers,
} from '@chobantonov/jsonforms-react-ark-renderers';
import {
  ArkRendererSettings,
  createArkRendererStyle,
  arkExtendedRenderers,
} from '@chobantonov/jsonforms-react-ark-extended-renderers';
import {
  ActionEvent,
  HandleActionContext,
} from '@chobantonov/jsonforms-react-extended-renderers';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';

export const JSON_FORMS_ARK_TAG = 'jsonforms-react-ark';

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
  density?: ArkRendererSettings['density'];
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
.ark-jsonforms-host { display: grid; gap: 12px; --ark-jsonforms-radius: 6px; --ark-jsonforms-accent: #2563eb; }
.ark-jsonforms-host[data-dark='true'] { background: #0f172a; color: #e2e8f0; }
.ark-jsonforms-root,
.ark-jsonforms-layout { box-sizing: border-box; }
.ark-jsonforms-layout { display: flex; gap: 12px; width: 100%; }
.ark-jsonforms-layout-column { flex-direction: column; }
.ark-jsonforms-layout-row { align-items: flex-start; flex-direction: row; flex-wrap: wrap; }
.ark-jsonforms-field { display: grid; gap: 5px; min-width: 220px; }
.ark-jsonforms-label { color: #1f2937; font-size: 13px; font-weight: 600; }
.ark-jsonforms-input {
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: var(--ark-jsonforms-radius, 6px);
  color: #111827;
  font: inherit;
  min-height: 36px;
  padding: 7px 10px;
}
.ark-jsonforms-input:focus {
  border-color: var(--ark-jsonforms-accent, #2563eb);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ark-jsonforms-accent, #2563eb) 18%, transparent);
  outline: none;
}
.ark-jsonforms-description { color: #64748b; font-size: 12px; }
.ark-jsonforms-error { color: #b91c1c; font-size: 12px; }
.ark-jsonforms-checkbox { align-items: center; display: inline-flex; gap: 8px; }
.ark-jsonforms-group,
.ark-jsonforms-array,
.ark-jsonforms-object {
  border: 1px solid #e2e8f0;
  border-radius: var(--ark-jsonforms-radius, 6px);
  display: grid;
  gap: 12px;
  padding: 14px;
}
.ark-jsonforms-group > legend,
.ark-jsonforms-array h3,
.ark-jsonforms-object h3 {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}
.ark-jsonforms-array-header { align-items: center; display: flex; justify-content: space-between; }
.ark-jsonforms-array-item { border-top: 1px solid #e2e8f0; display: grid; gap: 10px; padding-top: 12px; }
.ark-jsonforms-button,
.ark-jsonforms-tab {
  background: var(--ark-jsonforms-accent, #2563eb);
  border: 0;
  border-radius: var(--ark-jsonforms-radius, 6px);
  color: #fff;
  cursor: pointer;
  font: inherit;
  min-height: 34px;
  padding: 7px 12px;
}
.ark-jsonforms-button:disabled,
.ark-jsonforms-tab:disabled { cursor: not-allowed; opacity: 0.5; }
.ark-jsonforms-button-danger { background: #dc2626; justify-self: flex-start; }
.ark-jsonforms-tabs { border-bottom: 1px solid #e2e8f0; display: flex; gap: 6px; margin-bottom: 12px; }
.ark-jsonforms-tab {
  background: transparent;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  color: #475569;
}
.ark-jsonforms-tab[data-active] { background: var(--ark-jsonforms-accent, #2563eb); color: #fff; }
.ark-jsonforms-static-label { color: #334155; font-weight: 600; }
.ark-jsonforms-alert { border: 1px solid #bfdbfe; border-radius: var(--ark-jsonforms-radius, 6px); padding: 10px 12px; }
`;

export class JsonFormsArkElement extends HTMLElement {
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
  set density(value: ArkRendererSettings['density']) {
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
      ...((parseJson(this.state.rendererSettings) as ArkRendererSettings) ??
        {}),
      accentColor: this.state.accentColor,
      borderRadius:
        typeof this.state.borderRadius === 'string'
          ? Number(this.state.borderRadius)
          : this.state.borderRadius,
      density: this.state.density,
    } as ArkRendererSettings;
    const style = createArkRendererStyle(rendererSettings, dark);

    this.root.render(
      <>
        <style>{baseStyle}</style>
        <style>{this.state.customStyle ?? ''}</style>
        <div
          className='ark-jsonforms-host'
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
              renderers={arkRenderers.concat(arkExtendedRenderers)}
              cells={arkCells}
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

export const registerJsonFormsArk = (tagName: string = JSON_FORMS_ARK_TAG) => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, JsonFormsArkElement);
  }
};
