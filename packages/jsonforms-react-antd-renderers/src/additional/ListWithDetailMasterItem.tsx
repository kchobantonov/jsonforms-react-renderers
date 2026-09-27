import DeleteFilled from '@ant-design/icons/DeleteFilled';
import type {
  OwnPropsOfMasterListItem,
  StatePropsOfMasterItem,
} from '@jsonforms/core';
import { withJsonFormsMasterListItemProps } from '@jsonforms/react';
import {
  Avatar,
  Button,
  Flex,
  Tooltip,
  Typography,
  theme as antdTheme,
} from 'antd';
import React from 'react';

import { useI18n } from '../util/translate';

const { Text } = Typography;

const SR_ONLY: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
};

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
  hideAvatar,
}: StatePropsOfMasterItem & { hideAvatar?: boolean }) => {
  const t = useI18n();
  const { useToken } = antdTheme;
  const { token: theme } = useToken();

  return (
    <Flex
      align='center'
      gap={theme.marginXS}
      className='jsonforms-list-detail-item'
      onClick={handleSelect(index)}
      style={{
        paddingBlock: theme.paddingSM,
        paddingInline: theme.paddingXS,
        background: selected ? theme.controlItemBgActive : undefined,
        borderRadius: theme.borderRadius,
      }}
    >
      <Button
        type='text'
        aria-pressed={selected}
        onClick={(event) => {
          event.stopPropagation();
          handleSelect(index)();
        }}
        style={{
          flex: 1,
          minWidth: 0,
          height: 'auto',
          justifyContent: 'flex-start',
        }}
      >
        {hideAvatar ? (
          <span style={SR_ONLY}>
            {t('array.indexLabel')} {index + 1}
          </span>
        ) : (
          <Avatar
            aria-label={t('array.indexLabel')}
            style={
              selected
                ? { background: theme.colorPrimary, flexShrink: 0 }
                : { flexShrink: 0 }
            }
            size='small'
          >
            {index + 1}
          </Avatar>
        )}
        <Text ellipsis>{childLabel ?? index}</Text>
      </Button>
      <Tooltip title={translations.removeTooltip} key='action_remove'>
        <Button
          disabled={!enabled || disableRemove}
          aria-label={translations.removeAriaLabel}
          icon={<DeleteFilled rev={undefined} />}
          onClick={(event) => {
            /*
                The whole row selects on click, and this button is inside it.
                Without this, pressing Delete on one entry while reading
                another also navigates to the one being deleted - and then
                asks about it, so declining could not put the selection back:
                the move had already happened on the way in.

                The array layout and the mixed tree stop propagation on their
                row actions for the same reason.
              */
            event.stopPropagation();
            removeItem(path, index)();
          }}
        />
      </Tooltip>
    </Flex>
  );
};

/*
  `hideAvatar` is an own prop the renderer passes straight through, but the
  HOC's own-props type is fixed by JSON Forms, so the connected component is
  re-typed here rather than at each call site.
*/
export default withJsonFormsMasterListItemProps(
  ListWithDetailMasterItem
) as React.ComponentType<OwnPropsOfMasterListItem & { hideAvatar?: boolean }>;
