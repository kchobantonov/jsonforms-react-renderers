import { createChoiceCards } from '@chobantonov/jsonforms-react-renderer-common/choiceCards';
import { useConfirmation } from '../complex/mixed/useConfirmation';
export const ChoiceCards = createChoiceCards(useConfirmation, () => ({
  border: 'hsl(var(--border, 214.3 31.8% 91.4%))',
  selected: 'hsl(var(--primary, 222.2 47.4% 11.2%))',
  focus: 'hsl(var(--ring, 222.2 84% 4.9%))',
  background: 'hsl(var(--card, 0 0% 100%))',
  error: 'hsl(var(--destructive, 0 84.2% 60.2%))',
}));
