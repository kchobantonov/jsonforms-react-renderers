/*
  The MIT License
  
  Copyright (c) 2017-2019 EclipseSource Munich
  https://github.com/eclipsesource/jsonforms
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  
  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.
  
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
*/
import {
  ControlElement,
  encode,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  Resolve,
} from '@jsonforms/core';
import { DispatchCell } from '@jsonforms/react';
//import isEmpty from 'lodash/isEmpty';
import React from 'react';

export interface DataCellProps {
  path: string;
  propName?: string;
  schema: JsonSchema;
  rootSchema: JsonSchema;
  errors: string;
  enabled: boolean;
  renderers?: JsonFormsRendererRegistryEntry[];
  cells?: JsonFormsCellRendererRegistryEntry[];
}

const controlWithoutLabel = (scope: string): ControlElement => ({
  type: 'Control',
  scope: scope,
  label: false,
});

const DataCell = ({
  path,
  propName,
  schema,
  rootSchema,
  enabled,
  renderers,
  cells,
}: DataCellProps) => {
  //const isValid = isEmpty(errors);

  return (
    <>
      {schema.properties ? (
        <DispatchCell
          schema={Resolve.schema(
            schema,
            `#/properties/${encode(propName)}`,
            rootSchema
          )}
          uischema={controlWithoutLabel(`#/properties/${encode(propName)}`)}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      ) : (
        <DispatchCell
          schema={schema}
          uischema={controlWithoutLabel('#')}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      )}
    </>
  );
};

export default DataCell;
