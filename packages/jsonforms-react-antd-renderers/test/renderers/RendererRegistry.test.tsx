import {
  antdCells,
  antdRenderers,
  MixedRenderer,
  mixedControlTester,
} from '../../src';
import {
  antdButtonRendererTester,
  antdColorControlTester,
  antdDurationControlTester,
  antdExtendedRenderers,
  antdNullControlTester,
  antdSplitLayoutTester,
} from '../../../jsonforms-react-antd-extended-renderers/src';
import {
  antdWebcomponentCells,
  antdWebcomponentRenderers,
} from '../../../jsonforms-react-antd-webcomponent/src/renderers';
import {
  sharedSplitLayoutTester,
  horizontalColumnsLayoutTester,
  spacerRendererTester,
  imageViewRendererTester,
  separatorRendererTester,
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
      antdButtonRendererTester,
      antdColorControlTester,
      antdDurationControlTester,
      antdNullControlTester,
      antdSplitLayoutTester,
      sharedSplitLayoutTester,
      horizontalColumnsLayoutTester,
      spacerRendererTester,
      imageViewRendererTester,
      separatorRendererTester,
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
