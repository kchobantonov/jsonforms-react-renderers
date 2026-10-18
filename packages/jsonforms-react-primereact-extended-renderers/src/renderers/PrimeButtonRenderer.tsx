import { Button } from 'primereact/button';
import {
  createButtonRenderer,
  buttonRendererTester,
} from '@chobantonov/jsonforms-react-extended-renderers';

export const primeButtonRendererTester = buttonRendererTester;

export const PrimeButtonRenderer = createButtonRenderer({
  ButtonComponent: Button,
  buttonProps: { type: 'button' },
  getButtonProps: ({ pending, color, uischema }) => ({
    loading: pending,
    style: uischema.options?.fullWidth === true ? { width: '100%' } : undefined,
    severity:
      color === 'error'
        ? 'danger'
        : color === 'alternative'
          ? 'contrast'
          : color === 'primary'
            ? undefined
            : color,
  }),
});
