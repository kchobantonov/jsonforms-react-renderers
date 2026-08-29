import { JsonForms } from '@jsonforms/react';
import type { ValidationMode } from '@jsonforms/core';
import { HandleActionContext } from '@chobantonov/jsonforms-react-primereact-extended-renderers';
import {
  primereactWebcomponentCells,
  primereactWebcomponentRenderers,
} from './renderers';
import { PrimeReactProvider } from 'primereact/api';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';

export const JSON_FORMS_PRIMEREACT_TAG = 'jsonforms-react-primereact';

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
  if (typeof value === 'boolean') {
    return value;
  }
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
];

export class JsonFormsPrimeReactElement extends HTMLElement {
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

  private setValue(name: string, value: JsonInput) {
    const key = name.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    this.state = {
      ...this.state,
      [key]: value,
    };
    this.render();
  }

  private dispatch(name: string, detail: unknown) {
    this.dispatchEvent(
      new CustomEvent(name, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  private render() {
    if (!this.root) return;

    const readonly = parseBoolean(this.state.readonly) ?? false;
    const dark =
      parseBoolean(this.state.dark) ?? parseMode(this.state.mode) === 'dark';
    const rtl = parseBoolean(this.state.rtl) ?? false;
    const config = parseJson(this.state.config) as
      | Record<string, unknown>
      | undefined;
    const translate = this.state.translations
      ? createTranslator(this.state.translations, this.state.locale)
      : undefined;

    this.root.render(
      <PrimeReactProvider value={{ inputStyle: 'outlined' }}>
        <div
          className={
            dark
              ? 'jsonforms-react-primereact dark app-dark'
              : 'jsonforms-react-primereact'
          }
          dir={rtl ? 'rtl' : 'ltr'}
        >
          <style>{`
            :host { display: block; color-scheme: light dark; }
            .jsonforms-react-primereact { box-sizing: border-box; min-width: 0; color: var(--p-text-color, #1f2937); background: var(--p-content-background, #fff); }
            .jsonforms-react-primereact.dark { color-scheme: dark; --p-content-background: #111a2d; --p-text-color: #eef4ff; background: var(--p-content-background); color: var(--p-text-color); }
            ${this.state.customStyle ?? ''}
          `}</style>
          <slot name='styles' />
          <slot name='form-header' />
          <HandleActionContext.Provider
            value={(event) => this.dispatch('handle-action', event)}
          >
            <JsonForms
              data={parseJson(this.state.data)}
              schema={parseJson(this.state.schema)}
              uischema={parseJson(this.state.uischema)}
              uischemas={parseJson(this.state.uischemas) as any}
              config={{
                ...config,
                readonly,
              }}
              readonly={readonly}
              validationMode={this.state.validationMode}
              i18n={{
                locale: this.state.locale,
                translate,
              }}
              additionalErrors={parseJson(this.state.additionalErrors) as any}
              renderers={primereactWebcomponentRenderers}
              cells={primereactWebcomponentCells}
              onChange={(event) => this.dispatch('change', event)}
            />
          </HandleActionContext.Provider>
          <slot name='form-footer' />
        </div>
      </PrimeReactProvider>
    );
  }
}

export const registerJsonFormsPrimeReact = (
  tagName = JSON_FORMS_PRIMEREACT_TAG
): CustomElementConstructor => {
  const existing = customElements.get(tagName);
  if (existing) return existing;
  customElements.define(tagName, JsonFormsPrimeReactElement);
  return JsonFormsPrimeReactElement;
};
