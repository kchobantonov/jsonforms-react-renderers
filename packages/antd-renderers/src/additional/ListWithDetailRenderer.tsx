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
  and,
  ArrayLayoutProps,
  composePaths,
  computeLabel,
  createDefaultValue,
  findUISchema,
  isObjectArray,
  RankedTester,
  rankWith,
  uiTypeIs,
} from '@jsonforms/core';
import {
  JsonFormsDispatch,
  withJsonFormsArrayLayoutProps,
} from '@jsonforms/react';
import { Col, Empty, List, Row } from 'antd';
import Hidden from '../util/Hidden';

import range from 'lodash/range';
import React, { useCallback, useMemo, useState } from 'react';
import { ArrayLayoutToolbar } from '../layouts/ArrayToolbar';
import ListWithDetailMasterItem from './ListWithDetailMasterItem';
import merge from 'lodash/merge';

export const ListWithDetailRenderer = ({
  uischemas,
  schema,
  uischema,
  path,
  enabled,
  errors,
  visible,
  label,
  required,
  removeItems,
  addItem,
  data,
  renderers,
  cells,
  config,
  rootSchema,
  translations,
  description,
}: ArrayLayoutProps) => {
  const [selectedIndex, setSelectedIndex] = useState(undefined);
  const handleRemoveItem = useCallback(
    (p: string, value: any) => () => {
      removeItems(p, [value])();
      if (selectedIndex === value) {
        setSelectedIndex(undefined);
      } else if (selectedIndex > value) {
        setSelectedIndex(selectedIndex - 1);
      }
    },
    [removeItems, setSelectedIndex]
  );
  const handleListItemClick = useCallback(
    (index: number) => () => setSelectedIndex(index),
    [setSelectedIndex]
  );
  const handleCreateDefaultValue = useCallback(
    () => createDefaultValue(schema, rootSchema),
    [createDefaultValue]
  );
  const foundUISchema = useMemo(
    () =>
      findUISchema(
        uischemas,
        schema,
        uischema.scope,
        path,
        undefined,
        uischema,
        rootSchema
      ),
    [uischemas, schema, uischema.scope, path, uischema, rootSchema]
  );
  const appliedUiSchemaOptions = merge({}, config, uischema.options);

  React.useEffect(() => {
    setSelectedIndex(undefined);
  }, [schema]);

  return (
    <Hidden hidden={!visible}>
      <ArrayLayoutToolbar
        translations={translations}
        label={computeLabel(
          label,
          required,
          appliedUiSchemaOptions.hideRequiredAsterisk
        )}
        description={description}
        errors={errors}
        path={path}
        enabled={enabled}
        addItem={addItem}
        createDefault={handleCreateDefaultValue}
      />
      <Row gutter={8}>
        <Col xs={6}>
          {data > 0 ? (
            <List
              dataSource={range(data)}
              renderItem={(_item, index) => (
                <ListWithDetailMasterItem
                  index={index}
                  path={path}
                  schema={schema}
                  enabled={enabled}
                  handleSelect={handleListItemClick}
                  removeItem={handleRemoveItem}
                  selected={selectedIndex === index}
                  key={index}
                  translations={translations}
                />
              )}
            ></List>
          ) : (
            <Empty description='No data' />
          )}
        </Col>
        <Col xs={18}>
          {selectedIndex !== undefined ? (
            <JsonFormsDispatch
              renderers={renderers}
              cells={cells}
              visible={visible}
              schema={schema}
              uischema={foundUISchema}
              path={composePaths(path, `${selectedIndex}`)}
            />
          ) : (
            <Empty description={translations.noSelection} />
          )}
        </Col>
      </Row>
    </Hidden>
  );
};

export const listWithDetailTester: RankedTester = rankWith(
  4,
  and(uiTypeIs('ListWithDetail'), isObjectArray)
);

export default withJsonFormsArrayLayoutProps(ListWithDetailRenderer);