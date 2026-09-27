import React, { useEffect, useRef } from 'react';
import type { ValidationMode } from '@jsonforms/core';
import type { JsonFormsInitStateProps } from '@jsonforms/react';
import type { ActionEvent } from '@chobantonov/jsonforms-react-extended-renderers';

/**
 * Renders the demo through the published web component instead of React.
 *
 * The same example, the same data, mounted as a custom element - which is what
 * makes the demo evidence that the web component is not a second
 * implementation. Attributes are set as properties rather than markup because
 * several of them are objects.
 */
export const WebComponentHost = ({
  tagName,
  props,
  dark,
  mode,
  rtl,
  locale,
  validationMode,
  rendererSettings,
  onChange,
  onAction,
}: {
  tagName: string;
  props: JsonFormsInitStateProps;
  dark: boolean;
  mode: string;
  rtl: boolean;
  locale: string;
  validationMode: ValidationMode;
  rendererSettings: Record<string, any>;
  onChange: (data: unknown) => void;
  onAction: (event: ActionEvent) => void;
}) => {
  const ref = useRef<HTMLElement>();

  useEffect(() => {
    const element = ref.current as any;
    if (!element) return;

    element.data = props.data;
    element.schema = props.schema;
    element.uischema = props.uischema;
    element.uischemas = props.uischemas;
    element.config = props.config;
    element.readonly = props.readonly;
    element.validationMode = validationMode;
    element.locale = locale;
    element.translations = props.i18n?.translate;
    element.additionalErrors = props.additionalErrors;
    element.dark = dark;
    element.mode = mode;
    element.rtl = rtl;
    element.rendererSettings = rendererSettings;
  }, [props, dark, mode, rtl, locale, validationMode, rendererSettings]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleChange = (event: Event) =>
      onChange((event as CustomEvent).detail?.data);
    const handleAction = (event: Event) =>
      onAction((event as CustomEvent).detail);

    element.addEventListener('change', handleChange);
    element.addEventListener('handle-action', handleAction);
    return () => {
      element.removeEventListener('change', handleChange);
      element.removeEventListener('handle-action', handleAction);
    };
  }, [onAction, onChange]);

  return React.createElement(
    tagName,
    { ref },
    <div slot='form-header' className='webcomponent-form-header'>
      Web component mode
    </div>,
    <div slot='form-footer' className='webcomponent-form-footer' />
  );
};
