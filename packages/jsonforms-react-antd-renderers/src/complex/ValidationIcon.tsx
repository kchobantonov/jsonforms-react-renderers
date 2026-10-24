import React from 'react';
import { Button } from 'antd';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import { ErrorFeedback } from './ErrorFeedback';
export interface ValidationProps {
  errorMessages: string;
  id: string;
  path?: string;
  local?: boolean;
}
export const ValidationIcon: React.FC<ValidationProps> = ({
  errorMessages,
  id,
  path,
  local,
}) => {
  return errorMessages ? (
    <ErrorFeedback errors={errorMessages} path={path} local={local}>
      <Button
        id={id}
        data-validation-summary
        type='text'
        danger
        size='small'
        aria-label={errorMessages}
        icon={<ExclamationCircleOutlined />}
      />
    </ErrorFeedback>
  ) : null;
};
export default ValidationIcon;
