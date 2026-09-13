import { primeSplitLayoutTester } from '../../../jsonforms-react-primereact-extended-renderers/src';
import {
  MixedRenderer,
  mixedControlTester,
  primereactCells,
  primereactRenderers,
} from '../../src';
import { primereactExtendedRenderers } from '../../../jsonforms-react-primereact-extended-renderers/src';
import {
  primereactWebcomponentCells,
  primereactWebcomponentRenderers,
} from '../../../jsonforms-react-primereact-webcomponent/src/renderers';
import {
  buttonRendererTester,
  sharedSplitLayoutTester,
  horizontalColumnsLayoutTester,
  spacerRendererTester,
  imageViewRendererTester,
  separatorRendererTester,
  namedTemplateTester,
  slotRendererTester,
  templateRendererTester,
} from '../../../jsonforms-react-extended-renderers/src';

describe('PrimeReact renderer registries', () => {
  it('registers the mixed renderer from its dedicated module', () => {
    expect(primereactRenderers).toContainEqual({
      tester: mixedControlTester,
      renderer: MixedRenderer,
    });
  });

  it('contains the complete extended renderer set', () => {
    expect(primereactExtendedRenderers.map(({ tester }) => tester)).toEqual([
      primeSplitLayoutTester,
      buttonRendererTester,
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
    expect(primereactWebcomponentRenderers).toEqual([
      ...primereactRenderers,
      ...primereactExtendedRenderers,
    ]);
    expect(primereactWebcomponentCells).toBe(primereactCells);
  });
});
