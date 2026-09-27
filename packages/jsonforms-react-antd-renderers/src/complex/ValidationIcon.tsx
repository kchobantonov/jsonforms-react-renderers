import React from 'react';

import { Badge, Tooltip, theme as antdTheme } from 'antd';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';

export interface ValidationProps {
  errorMessages: string;
  id: string;
}

export const ValidationIcon: React.FC<ValidationProps> = ({
  errorMessages,
  id,
}) => {
  const { useToken } = antdTheme;
  const { token: theme } = useToken();

  return errorMessages ? (
    <Tooltip id={id} title={errorMessages}>
      <Badge text={errorMessages.split('\n').length} size='small'>
        <ExclamationCircleOutlined
          /*
            The count is the only thing rendered; the messages live in the
            tooltip, which opens on hover and so is not reachable by a screen
            reader - it would announce "2" and nothing else. Naming the icon
            with the messages keeps the explanation available, which is what
            the portable contract asks for: "Provide an **accessible**
            explanation of array-level errors near the array."

            Same treatment, and the same reasoning, as the cell feedback icon
            in `util/cellMode.tsx`.
          */
          role='img'
          aria-label={errorMessages}
          style={{ fontSize: '20px', color: theme.colorError }}
          rev={undefined}
        />
      </Badge>
    </Tooltip>
  ) : null;
};

export default ValidationIcon;
