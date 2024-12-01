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
import type { StatePropsOfMasterItem } from '@jsonforms/core';
import { withJsonFormsMasterListItemProps } from '@jsonforms/react';
import { Avatar } from 'primereact/avatar';
import { Button } from 'primereact/button';
import { Tooltip } from 'primereact/tooltip';
import React from 'react';

export const ListWithDetailMasterItem = ({
  index,
  childLabel,
  //selected,
  enabled,
  handleSelect,
  removeItem,
  path,
  translations,
  disableRemove,
}: StatePropsOfMasterItem) => {
  // const avatarStyle = useMemo(
  //   () => (selected ? { background: theme.colorPrimary } : {}),
  //   [selected]
  // );

  // const listItemStyle = useMemo(
  //   () =>
  //     selected
  //       ? {
  //           background: theme.controlItemBgActive,
  //           borderRadius: '5px',
  //         }
  //       : {},
  //   [selected]
  // );

  return (
    <div
      key={index}
      //      style={listItemStyle}
      onClick={() => handleSelect(index)()}
      className='p-d-flex p-ai-center p-jc-between'
    >
      <div className='p-d-flex p-ai-center'>
        <Avatar label={(index + 1).toString()} />
        <span className='p-text-ellipsis' style={{ marginLeft: '8px' }}>
          {childLabel}
        </span>
      </div>
      <div>
        <Tooltip
          target={`#remove-button-${index}`}
          content={translations.removeTooltip}
        />
        <Button
          id={`remove-button-${index}`}
          icon='pi pi-trash'
          className='p-button-rounded p-button-text p-button-danger'
          disabled={!enabled || disableRemove}
          aria-label={translations.removeAriaLabel}
          onClick={(e) => {
            e.stopPropagation();
            removeItem(path, index)();
          }}
        />
      </div>
    </div>
  );
};

export default withJsonFormsMasterListItemProps(ListWithDetailMasterItem);
