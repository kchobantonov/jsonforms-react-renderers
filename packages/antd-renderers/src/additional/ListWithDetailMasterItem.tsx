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
import DeleteFilled from '@ant-design/icons/DeleteFilled';
import type { StatePropsOfMasterItem } from '@jsonforms/core';
import { withJsonFormsMasterListItemProps } from '@jsonforms/react';
import { Avatar, Button, List, Tooltip, theme as antdTheme } from 'antd';
import Text from 'antd/es/typography/Text';
import React, { useMemo } from 'react';

export const ListWithDetailMasterItem = ({
  index,
  childLabel,
  selected,
  enabled,
  handleSelect,
  removeItem,
  path,
  translations,
  disableRemove,
}: StatePropsOfMasterItem) => {
  const { useToken } = antdTheme;
  const { token: theme } = useToken();

  const avatarStyle = useMemo(
    () => (selected ? { background: theme.colorPrimary } : {}),
    [selected]
  );

  const listItemStyle = useMemo(
    () =>
      selected
        ? {
            background: theme.controlItemBgActive,
            borderRadius: '5px',
          }
        : {},
    [selected]
  );

  return (
    <List.Item
      key={index}
      onClick={handleSelect(index)}
      style={listItemStyle}
      actions={[
        <Tooltip title={translations.removeTooltip} key='action_remove'>
          <Button
            disabled={!enabled || disableRemove}
            aria-label={translations.removeAriaLabel}
            icon={<DeleteFilled rev={undefined} />}
            onClick={removeItem(path, index)}
          />
        </Tooltip>,
      ]}
    >
      <List.Item.Meta
        style={{ marginLeft: '8px' }}
        avatar={
          <Avatar aria-label='Index' style={avatarStyle} size={'small'}>
            {index + 1}
          </Avatar>
        }
        title={<Text ellipsis={true}>{childLabel}</Text>}
      />
    </List.Item>
  );
};

export default withJsonFormsMasterListItemProps(ListWithDetailMasterItem);
