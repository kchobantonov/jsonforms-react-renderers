import type { ShadcnComponentSet } from '@chobantonov/jsonforms-react-shadcn-renderers';
import { JsonFormsAlert } from './alert-adapter';
import { JsonFormsButton } from './button-adapter';
import { JsonFormsCheckbox } from './checkbox-adapter';
import { JsonFormsInput } from './input-adapter';
import { JsonFormsSelect } from './select-adapter';
import { JsonFormsTabs } from './tabs-adapter';

export const shadcnComponents: ShadcnComponentSet = {
  Alert: JsonFormsAlert,
  Button: JsonFormsButton,
  Checkbox: JsonFormsCheckbox,
  Input: JsonFormsInput,
  Select: JsonFormsSelect,
  Tabs: JsonFormsTabs,
};
