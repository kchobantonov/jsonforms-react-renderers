import { useEditorAppearance } from '../util/useEditorAppearance';
import { useMonacoShadowStyles } from '../util/useMonacoShadowStyles';
import React, { useEffect, useState, useRef } from 'react';
import { ControlProps } from '@jsonforms/core';
import { useJsonForms, withJsonFormsControlProps } from '@jsonforms/react';
import Editor from '@monaco-editor/react';
import { EditorRendererComponents } from './EditorControlFrame';
import {
  decodeEditorValue,
  encodeEditorValue,
  resolveEditorLanguage,
} from '../util/editorControls';

export const createMonacoControlRenderer = ({
  Frame,
  Button,
}: EditorRendererComponents) => {
  const MonacoControl = (props: ControlProps) => {
    const anchor = useRef<HTMLDivElement>(null);
    const [maximized, setMaximized] = useState(false);
    const context = useJsonForms();
    const options = { ...props.config, ...props.uischema.options };
    const theme = useEditorAppearance(anchor, options.theme ?? options.mode);
    useMonacoShadowStyles(anchor);
    const language = resolveEditorLanguage(options, context.core?.data);
    const convert = language === 'json' && options.convertJson === true;
    const encoded = encodeEditorValue(props.data, convert);
    const [text, setText] = useState(encoded);
    const lastCommitted = useRef<string>();
    const [invalid, setInvalid] = useState(false);
    useEffect(() => {
      if (lastCommitted.current !== encoded) setText(encoded);
      setInvalid(false);
    }, [encoded, language, convert]);
    if (!props.visible) return null;
    const monaco = options.monaco ?? {};
    const rows = monaco.autoGrow
      ? Math.max(
          monaco.minRows ?? 3,
          Math.min(monaco.maxRows ?? 30, text.split('\n').length)
        )
      : monaco.rows ?? 10;
    return (
      <Frame {...props} errors={invalid ? 'Enter valid JSON.' : props.errors}>
        <div
          ref={anchor}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setMaximized(false);
          }}
          style={
            maximized
              ? {
                  position: 'fixed',
                  inset: 16,
                  zIndex: 1400,
                  background: theme === 'vs-dark' ? '#1e1e1e' : '#fff',
                  padding: 16,
                }
              : { minWidth: 0 }
          }
        >
          <Button onClick={() => setMaximized((value) => !value)}>
            {maximized ? 'Restore editor' : 'Maximize editor'}
          </Button>
          <Editor
            value={text}
            language={language}
            height={
              maximized ? 'calc(100% - 48px)' : options.height ?? rows * 20 + 20
            }
            theme={theme}
            options={{
              automaticLayout: true,
              minimap: { enabled: false },
              ...monaco.options,
              readOnly: !props.enabled || props.readonly,
              ariaLabel: props.label || 'Code editor',
            }}
            onMount={(editor) => {
              if (options.focus) editor.focus();
              for (const action of monaco.initActions ?? [])
                editor.getAction(action)?.run();
            }}
            onChange={(value) => {
              if (!props.enabled || props.readonly) return;
              const next = value ?? '';
              setText(next);
              const decoded = decodeEditorValue(next, convert);
              setInvalid(!decoded.valid);
              if (decoded.valid) {
                lastCommitted.current = encodeEditorValue(
                  decoded.value,
                  convert
                );
                props.handleChange(props.path, decoded.value);
              }
            }}
          />
        </div>
      </Frame>
    );
  };
  return withJsonFormsControlProps(MonacoControl);
};
