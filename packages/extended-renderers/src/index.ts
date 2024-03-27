import { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import TemplateLayoutRenderer, {
  templateRendererTester,
} from './extended/TemplateLayoutRenderer';

export const extendedRenderers: JsonFormsRendererRegistryEntry[] = [
  // controls
  {
    tester: templateRendererTester,
    renderer: TemplateLayoutRenderer,
  },
];
