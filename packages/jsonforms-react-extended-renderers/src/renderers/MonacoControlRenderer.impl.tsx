import { useEditorAppearance } from '../util/useEditorAppearance';
import { useExtendedTranslator } from '../util/useExtendedTranslator';
import { useMonacoShadowStyles } from '../util/useMonacoShadowStyles';
import React, { useEffect, useId, useState, useRef } from 'react';
import { ControlProps } from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import Editor from '@monaco-editor/react';
import {
  EditorRendererComponents,
  EditorSurfaceProps,
} from './EditorControlFrame';
import {
  decodeEditorValue,
  encodeEditorValue,
  resolveEditorLanguage,
} from '../util/editorControls';
import { useOwnedAdditionalErrors } from '../util/additionalErrors';
import {
  EditorMarker,
  countBlockingMarkers,
  editorSummaryError,
  resolvePropagateErrors,
} from '../util/editorDiagnostics';

const PlainSurface = ({ children, maximized }: EditorSurfaceProps) => (
  <div style={{ position: 'relative', height: maximized ? '100%' : undefined }}>
    {children}
  </div>
);

export const createMonacoControl = ({
  Frame,
  Button,
  MaximizeIcon,
  MinimizeIcon,
  Surface,
  useEditorTheme,
}: EditorRendererComponents) => {
  // Resolved once per renderer set so the hook call below stays unconditional.
  const useHostTheme = useEditorTheme ?? (() => undefined);
  const EditorSurface = Surface ?? PlainSurface;
  const MonacoControl = (props: ControlProps) => {
    const anchor = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const [maximized, setMaximized] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const context = useJsonForms();
    const options = { ...props.config, ...props.uischema.options };
    const hostTheme = useHostTheme();
    const t = useExtendedTranslator();
    const { isDark, customTheme } = useEditorAppearance(
      anchor,
      options.theme ?? options.mode,
      hostTheme?.isDark
    );
    // Monaco's own vocabulary lives here, not in the shared appearance hook.
    const theme = customTheme ?? (isDark ? 'vs-dark' : 'vs');
    useMonacoShadowStyles(anchor);
    const language = resolveEditorLanguage(options, context.core?.data);
    const convert = language === 'json' && options.convertJson === true;
    const encoded = encodeEditorValue(props.data, convert);
    const [text, setText] = useState(encoded);
    const lastCommitted = useRef<string>();
    const [invalid, setInvalid] = useState(false);

    /*
      Monaco's own diagnostics, as a count.

      Only error-level markers: warnings, hints and informational messages
      "stay inside Monaco; they do not contribute to the summary count or
      block form validity through this bridge."

      `onValidate` fires only for a language with a validating service - JSON,
      TypeScript, CSS and so on. For anything else the count stays zero, which
      is the honest answer: "syntax highlighting alone does not establish that
      language validation is available."
    */
    const [errorCount, setErrorCount] = useState(0);

    /*
      One error per editor **instance**, so two editors bound to the same path
      - or an editor sitting beside a host-published error - never overwrite
      each other. `useId` is unique per mounted component and stable across
      that component's renders, which is exactly the lifetime an owner needs.
    */
    const owner = useId();
    const propagate = resolvePropagateErrors(
      props.uischema.options,
      props.config
    );
    const summary =
      propagate && errorCount > 0
        ? [
            editorSummaryError({
              owner,
              path: props.path,
              language,
              errorCount,
              message:
                errorCount === 1
                  ? t('editor.languageError')
                  : t('editor.languageErrors').replace(
                      '{count}',
                      String(errorCount)
                    ),
            }),
          ]
        : [];
    /*
      Publishing an empty list is what clears it, so switching the option off,
      fixing the code, or unmounting all retract the summary through the same
      path rather than three special cases.
    */
    useOwnedAdditionalErrors(owner, summary, {
      /*
        This editor manages its own lifecycle: it republishes or retracts as
        the language service reports. The store's default - clear when the
        field's value changes - would wipe the summary on the first keystroke
        and let it reappear on the next validation pass, which reads as a
        flicker rather than as feedback.
      */
      clearOnChange: false,
    });

    // Match the editor canvas to the surface. Monaco >= 0.34 exposes its theme
    // colors as --vscode-* custom properties, so recoloring one instance is a
    // matter of setting them on an ancestor (custom properties inherit).
    // Deliberately NOT monaco.editor.defineTheme/setTheme: Monaco's theme
    // registry is global, so doing that would repaint every other Monaco editor
    // on the page, including ones the host application owns.
    const background = hostTheme?.background;
    const surfaceVars = background
      ? ({
          '--vscode-editor-background': background,
          '--vscode-editorGutter-background': background,
          '--vscode-minimap-background': background,
          '--vscode-editorStickyScroll-background': background,
        } as React.CSSProperties)
      : undefined;

    useEffect(() => {
      // Never re-sync from props while the field has focus. @monaco-editor/react
      // applies an external value by replacing the full model range with
      // forceMoveMarkers, which moves the caret to the end of the document, so a
      // re-sync mid-typing reads as "the cursor will not go past this line".
      // Anything that arrives while focused is picked up on blur.
      if (focused) return;
      if (lastCommitted.current !== encoded) setText(encoded);
      setInvalid(false);
    }, [encoded, language, convert, focused]);

    useEffect(() => {
      // Toggling maximize swaps the container between fixed and inline layout.
      // automaticLayout does not reliably catch that, leaving the editor stuck
      // at the maximized width after restoring, so re-measure once settled.
      const editor = editorRef.current;
      if (!editor) return;
      const frame = requestAnimationFrame(() => {
        editor.layout({ width: 0, height: 0 });
        requestAnimationFrame(() => editor.layout());
      });
      return () => cancelAnimationFrame(frame);
    }, [maximized]);

    if (!props.visible) return null;
    const monaco = options.monaco ?? {};
    const rows = monaco.autoGrow
      ? Math.max(
          monaco.minRows ?? 3,
          Math.min(monaco.maxRows ?? 30, text.split('\n').length)
        )
      : monaco.rows ?? 10;
    const disabled = !props.enabled || props.readonly;
    const label = maximized ? t('editor.restore') : t('editor.maximize');
    return (
      <Frame
        {...props}
        errors={invalid ? t('editor.invalidJson') : props.errors}
      >
        <div
          ref={anchor}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setMaximized(false);
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={
            maximized
              ? {
                  ...surfaceVars,
                  position: 'fixed',
                  inset: 0,
                  zIndex: 1400,
                  background: 'rgba(0, 0, 0, 0.45)',
                  padding: 24,
                }
              : { ...surfaceVars, minWidth: 0 }
          }
        >
          <EditorSurface
            hovered={hovered}
            focused={focused}
            disabled={disabled}
            invalid={Boolean(invalid || props.errors)}
            maximized={maximized}
          >
            <Editor
              value={text}
              language={language}
              width={options.width}
              height={maximized ? '100%' : options.height ?? rows * 20 + 20}
              theme={theme}
              options={{
                automaticLayout: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 8, bottom: 8 },
                ...monaco.options,
                readOnly: disabled,
                ariaLabel: props.label || t('editor.ariaLabel'),
              }}
              onMount={(editor) => {
                editorRef.current = editor;
                if (options.focus) editor.focus();
                for (const action of monaco.initActions ?? [])
                  editor.getAction(action)?.run();
              }}
              onValidate={(markers) =>
                setErrorCount(countBlockingMarkers(markers as EditorMarker[]))
              }
              onChange={(value) => {
                if (disabled) return;
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
            {(hovered || focused || maximized) && (
              <div
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  zIndex: 1,
                  lineHeight: 0,
                  background,
                  borderRadius: 4,
                }}
              >
                <Button
                  onClick={() => setMaximized((v) => !v)}
                  title={label}
                  aria-label={label}
                >
                  {maximized
                    ? MinimizeIcon && <MinimizeIcon />
                    : MaximizeIcon && <MaximizeIcon />}
                  {!MaximizeIcon && !MinimizeIcon && label}
                </Button>
              </div>
            )}
          </EditorSurface>
        </div>
      </Frame>
    );
  };
  return MonacoControl;
};
