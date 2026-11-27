import { useI18n } from '../locale/translate';
import React from 'react';
import { type ControlProps } from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import { type JsonDataType } from './mixedSchema';
import { resolveMixedNodeEditor, changeMixedNodeType } from './mixedNodeEditor';
import { MixedScalarContext } from './mixedScalar';
import { type MixedTreeNode } from './mixedTree';
import { type useMixedRenderer } from './useMixedRenderer';

type MixedRendererState = ReturnType<typeof useMixedRenderer>;
type MixedDetailProps = Pick<
  ControlProps,
  'path' | 'enabled' | 'readonly' | 'renderers' | 'cells'
> &
  Pick<MixedRendererState, 'detailUiSchema' | 'withoutControlLabel'>;

function scalarContextPath(type: string | null | undefined, path: string) {
  return type === 'string' || type === 'number' || type === 'integer'
    ? path
    : undefined;
}

function nodeControlUiSchema(
  node: MixedTreeNode,
  detailUiSchema: MixedDetailProps['detailUiSchema'],
  isNestedPrimitive: boolean,
  withoutControlLabel: MixedDetailProps['withoutControlLabel'],
) {
  const uiSchema =
    node.path.length === 0 && detailUiSchema
      ? detailUiSchema
      : { type: 'Control', scope: '#' };
  return isNestedPrimitive ? withoutControlLabel(uiSchema) : uiSchema;
}

export function MixedNodeControl({
  node,
  path,
  enabled,
  readonly,
  renderers,
  cells,
  detailUiSchema,
  withoutControlLabel,
  rootSchema,
  handleChange,
  MixedTypeSelector,
  wrapStructured,
}: MixedDetailProps &
  Pick<ControlProps, 'rootSchema' | 'handleChange'> & {
    node?: MixedTreeNode;
    MixedTypeSelector: React.ComponentType<{
      clearable: boolean;
      disabled: boolean;
      types: string[];
      value: string | null;
      onChange: (value: string | undefined) => void;
    }>;
    wrapStructured: (children: React.ReactNode) => React.ReactElement;
  }) {
  if (!node) return null;
  const { isNestedPrimitive, nodeSchema, nodePath, nodeTypes, nodeType } =
    resolveMixedNodeEditor(node, path, rootSchema);
  const nodeSelector =
    node.path.length > 0 ? (
      <div className='jsonforms-mixed-renderer-detail-type'>
        <MixedTypeSelector
          clearable={false}
          disabled={!enabled || Boolean(readonly)}
          onChange={(value) =>
            changeMixedNodeType(
              node,
              value as JsonDataType | undefined,
              nodePath,
              rootSchema,
              handleChange,
            )
          }
          types={nodeTypes}
          value={nodeType}
        />
      </div>
    ) : null;
  const nodeControl =
    node.type === 'null' ? null : (
      <div className='jsonforms-mixed-renderer-detail-control'>
        <MixedScalarContext.Provider
          value={scalarContextPath(node.type, nodePath)}
        >
          <JsonFormsDispatch
            schema={nodeSchema}
            uischema={nodeControlUiSchema(
              node,
              detailUiSchema,
              isNestedPrimitive,
              withoutControlLabel,
            )}
            path={nodePath}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
            readonly={readonly}
          />
        </MixedScalarContext.Provider>
      </div>
    );

  const content = (
    <>
      {nodeSelector}
      {nodeControl}
    </>
  );
  if (isNestedPrimitive) {
    return (
      <div className='jsonforms-mixed-renderer-detail-primitive'>{content}</div>
    );
  }
  return wrapStructured(content);
}
export function MixedDetailControl({
  path,
  enabled,
  readonly,
  renderers,
  cells,
  detailUiSchema,
  withoutControlLabel,
  selectedType,
  selectedSchema,
}: MixedDetailProps &
  Pick<MixedRendererState, 'selectedType' | 'selectedSchema'>) {
  return selectedType !== 'null' && selectedSchema && detailUiSchema ? (
    <MixedScalarContext.Provider value={scalarContextPath(selectedType, path)}>
      <JsonFormsDispatch
        schema={selectedSchema}
        uischema={withoutControlLabel(detailUiSchema)}
        path={path}
        enabled={enabled}
        renderers={renderers}
        cells={cells}
        readonly={readonly}
      />
    </MixedScalarContext.Provider>
  ) : null;
}
export function MixedCodeControl({
  schema,
  uischema,
  path,
  enabled,
  readonly,
  renderers,
  cells,
}: ControlProps) {
  const t = useI18n();
  if (uischema.options?.format === 'code')
    return <div role='alert'>{t('mixed.codeUnavailable')}</div>;
  return (
    <JsonFormsDispatch
      schema={schema}
      uischema={{
        ...uischema,
        scope: '#',
        options: {
          ...uischema.options,
          format: 'code',
          language: 'json',
          convertJson: true,
          validateJsonSchema: true,
          propagateErrors: true,
        },
      }}
      path={path}
      enabled={enabled}
      readonly={readonly}
      renderers={renderers}
      cells={cells}
    />
  );
}
