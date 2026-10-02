import React from 'react';
import {
  Generate,
  JsonSchema,
  UISchemaElement,
  isLayout,
} from '@jsonforms/core';
import { JsonFormsDispatch } from '@jsonforms/react';
import omit from 'lodash/omit';

interface CombinatorPropertiesProps {
  schema: JsonSchema;
  combinatorKeyword: 'oneOf' | 'anyOf' | 'allOf';
  path: string;
  rootSchema: JsonSchema;
}

export class CombinatorProperties extends React.Component<
  CombinatorPropertiesProps,
  // TODO fix @typescript-eslint/ban-types
  // eslint-disable-next-line @typescript-eslint/ban-types
  {}
> {
  render() {
    const { schema, combinatorKeyword, path, rootSchema } = this.props;
    if (!schema.properties || Object.keys(schema.properties).length === 0)
      return null;

    const otherProps: JsonSchema = omit(
      schema,
      combinatorKeyword
    ) as JsonSchema;
    const foundUISchema: UISchemaElement = Generate.uiSchema(
      otherProps,
      'VerticalLayout',
      undefined,
      rootSchema
    );
    let isLayoutWithElements = false;
    if (foundUISchema !== null && isLayout(foundUISchema)) {
      isLayoutWithElements = foundUISchema.elements.length > 0;
    }

    if (isLayoutWithElements) {
      return (
        <JsonFormsDispatch
          schema={otherProps}
          path={path}
          uischema={foundUISchema}
        />
      );
    }

    return null;
  }
}

export default CombinatorProperties;
