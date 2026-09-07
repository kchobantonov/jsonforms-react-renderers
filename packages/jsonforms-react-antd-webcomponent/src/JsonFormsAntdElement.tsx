import { JsonForms } from '@jsonforms/react';
import type { ValidationMode } from '@jsonforms/core';
import { HandleActionContext } from '@chobantonov/jsonforms-react-antd-extended-renderers';
import { antdWebcomponentCells, antdWebcomponentRenderers } from './renderers';
import { ConfigProvider, Form, InputProps, theme as antdTheme } from 'antd';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { StyleProvider } from '@ant-design/cssinjs';

export const JSON_FORMS_ANTD_TAG = 'jsonforms-react-antd';

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
  if (typeof translations === 'function') return translations as any;
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
];

export class JsonFormsAntdElement extends HTMLElement {
  static get observedAttributes() {
    return observedAttributes;
  }

  private root?: Root;
  private colorScheme?: MediaQueryList;
  private renderQueued = false;
  private connectionVersion = 0;
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
    this.connectionVersion += 1;
    this.root ??= createRoot(this.shadowRoot);
    this.colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    this.colorScheme.addEventListener('change', this.handleColorSchemeChange);
    this.scheduleRender();
  }

  disconnectedCallback() {
    const connectionVersion = ++this.connectionVersion;
    const root = this.root;
    this.colorScheme?.removeEventListener(
      'change',
      this.handleColorSchemeChange
    );
    this.colorScheme = undefined;

    queueMicrotask(() => {
      if (
        this.isConnected ||
        connectionVersion !== this.connectionVersion ||
        root !== this.root
      ) {
        return;
      }
      root?.unmount();
      if (root === this.root) this.root = undefined;
    });
  }

  private handleColorSchemeChange = () => this.scheduleRender();

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

  private setValue(name: string, value: JsonInput) {
    const key = name.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    this.state = {
      ...this.state,
      [key]: value,
    };
    this.scheduleRender();
  }

  private scheduleRender() {
    if (this.renderQueued) return;
    this.renderQueued = true;
    queueMicrotask(() => {
      this.renderQueued = false;
      if (this.isConnected) this.render();
    });
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

    const schema = parseJson(this.state.schema);
    const data = parseJson(this.state.data);
    if (schema === undefined && (data === undefined || data === null)) return;

    const readonly = parseBoolean(this.state.readonly) ?? false;
    const selectedMode = parseMode(this.state.mode);
    const dark =
      parseBoolean(this.state.dark) ??
      (selectedMode === 'dark' ||
        (selectedMode === 'system' && Boolean(this.colorScheme?.matches)));
    const rtl = parseBoolean(this.state.rtl) ?? false;
    const config = parseJson(this.state.config) as
      | Record<string, unknown>
      | undefined;
    const translate = this.state.translations
      ? createTranslator(this.state.translations, this.state.locale)
      : undefined;
    const rendererSettings =
      (parseJson(this.state.rendererSettings) as Record<string, unknown>) ?? {};

    this.root.render(
      <StyleProvider container={this.shadowRoot ?? undefined}>
        <ConfigProvider
          direction={rtl ? 'rtl' : 'ltr'}
          getPopupContainer={() =>
            (this.shadowRoot?.querySelector(
              '.jsonforms-react-antd'
            ) as HTMLElement | null) ?? this
          }
          theme={{
            algorithm: dark
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm,
          }}
        >
          <div
            className={
              dark ? 'jsonforms-react-antd dark' : 'jsonforms-react-antd'
            }
            dir={rtl ? 'rtl' : 'ltr'}
          >
            <style>{`
            :host { display: block; color-scheme: ${dark ? 'dark' : 'light'}; }
            .jsonforms-react-antd { box-sizing: border-box; min-width: 0; color-scheme: light; background: #fff; color: rgba(0, 0, 0, 0.88); }
            .jsonforms-react-antd.dark { color-scheme: dark; background: #141414; color: rgba(255, 255, 255, 0.88); }
            ${this.state.customStyle ?? ''}
          `}</style>
            <slot name='styles' />
            <slot name='form-header' />
            <Form
              layout='vertical'
              variant={
                (rendererSettings.inputVariant ??
                  'outlined') as InputProps['variant']
              }
            >
              <HandleActionContext.Provider
                value={(event) => this.dispatch('handle-action', event)}
              >
                <JsonForms
                  data={data}
                  schema={schema}
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
                  additionalErrors={
                    parseJson(this.state.additionalErrors) as any
                  }
                  renderers={antdWebcomponentRenderers}
                  cells={antdWebcomponentCells}
                  onChange={(event) => this.dispatch('change', event)}
                />
              </HandleActionContext.Provider>
            </Form>
            <slot name='form-footer' />
          </div>
        </ConfigProvider>
      </StyleProvider>
    );
  }
}

export const registerJsonFormsAntd = (
  tagName = JSON_FORMS_ANTD_TAG
): CustomElementConstructor => {
  const existing = customElements.get(tagName);
  if (existing) return existing;
  customElements.define(tagName, JsonFormsAntdElement);
  return JsonFormsAntdElement;
};
