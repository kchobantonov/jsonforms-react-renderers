import { theme } from 'antd';
import { createChoiceCards } from '@chobantonov/jsonforms-react-renderer-common/choiceCards';
import { useConfirmation } from '../util/useConfirmation';
export const ChoiceCards = createChoiceCards(useConfirmation, () => {
  const { token } = theme.useToken();
  return {
    border: token.colorBorder,
    selected: token.colorPrimary,
    focus: token.colorPrimary,
    background: token.colorBgContainer,
    error: token.colorError,
  };
});
