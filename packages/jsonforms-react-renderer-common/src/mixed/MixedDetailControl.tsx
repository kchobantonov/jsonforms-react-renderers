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
  const nodeUiSchema =
    node.path.length === 0 && detailUiSchema
      ? detailUiSchema
      : { type: 'Control', scope: '#' };
  const nodeControl =
    node.type === 'null' ? null : (
      <div className='jsonforms-mixed-renderer-detail-control'>
        <MixedScalarContext.Provider
          value={
            ['string', 'number', 'integer'].includes(node.type)
              ? nodePath
              : undefined
          }
        >
          <JsonFormsDispatch
            schema={nodeSchema}
            uischema={
              isNestedPrimitive
                ? withoutControlLabel(nodeUiSchema)
                : nodeUiSchema
            }
            path={nodePath}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
            readonly={readonly}
          />
        </MixedScalarContext.Provider>
      </div>
    );

  return isNestedPrimitive ? (
    <div className='jsonforms-mixed-renderer-detail-primitive'>
      {nodeSelector}
      {nodeControl}
    </div>
  ) : (
    wrapStructured(
      <>
        {nodeSelector}
        {nodeControl}
      </>,
    )
  );
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
    <MixedScalarContext.Provider
      value={
        selectedType && ['string', 'number', 'integer'].includes(selectedType)
          ? path
          : undefined
      }
    >
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
  if (uischema.options?.format === 'code')
    return (
      <div role='alert'>
        Code presentation requires the Monaco renderer from the extended
        renderer registry.
      </div>
    );
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
