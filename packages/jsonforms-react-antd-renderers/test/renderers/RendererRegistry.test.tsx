import {
  antdCells,
  antdRenderers,
  MixedRenderer,
  mixedControlTester,
} from '../../src';
import { antdExtendedRenderers } from '../../../jsonforms-react-antd-extended-renderers/src';
import {
  antdWebcomponentCells,
  antdWebcomponentRenderers,
} from '../../../jsonforms-react-antd-webcomponent/src/renderers';
import {
  buttonRendererTester,
  namedTemplateTester,
  slotRendererTester,
  templateRendererTester,
} from '../../../jsonforms-react-extended-renderers/src';

describe('Ant Design renderer registries', () => {
  it('registers the mixed renderer from its dedicated module', () => {
    expect(antdRenderers).toContainEqual({
      tester: mixedControlTester,
      renderer: MixedRenderer,
    });
  });

  it('contains the complete extended renderer set', () => {
    expect(antdExtendedRenderers.map(({ tester }) => tester)).toEqual([
      buttonRendererTester,
      templateRendererTester,
      namedTemplateTester,
      slotRendererTester,
    ]);
  });

  it('composes base and extended renderers for the web component', () => {
    expect(antdWebcomponentRenderers).toEqual([
      ...antdRenderers,
      ...antdExtendedRenderers,
    ]);
    expect(antdWebcomponentCells).toBe(antdCells);
  });
});
