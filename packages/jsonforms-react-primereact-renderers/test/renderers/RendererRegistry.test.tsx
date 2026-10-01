import {
  primeSplitLayoutTester,
  primeNullControlTester,
  primeDurationControlTester,
  primeColorControlTester,
  primereactExtendedRenderers,
} from '../../../jsonforms-react-primereact-extended-renderers/src';
import {
  MixedRenderer,
  mixedControlTester,
  primereactCells,
  primereactRenderers,
} from '../../src';
import {
  primereactWebcomponentCells,
  primereactWebcomponentRenderers,
} from '../../../jsonforms-react-primereact-webcomponent/src/renderers';
import {
  buttonRendererTester,
  sharedSplitLayoutTester,
  spacerRendererTester,
  imageViewRendererTester,
  separatorRendererTester,
  namedTemplateTester,
  slotRendererTester,
  extendedAgGridTester,
  monacoControlTester,
  linkRendererTester,
  markupLabelTester,
  tsxTemplateLayoutTester,
} from '../../../jsonforms-react-extended-renderers/src';

describe('PrimeReact renderer registries', () => {
  it('registers the mixed renderer from its dedicated module', () => {
    expect(primereactRenderers).toContainEqual({
      tester: mixedControlTester,
      renderer: MixedRenderer,
    });
  });

  it('contains the library-specific and shared extended renderers', () => {
    expect(primereactExtendedRenderers.map(({ tester }) => tester)).toEqual(
      expect.arrayContaining([
        extendedAgGridTester,
        monacoControlTester,
        primeNullControlTester,
        primeDurationControlTester,
        primeColorControlTester,
        primeSplitLayoutTester,
        buttonRendererTester,
        sharedSplitLayoutTester,
        spacerRendererTester,
        imageViewRendererTester,
        separatorRendererTester,
        linkRendererTester,
        markupLabelTester,
        tsxTemplateLayoutTester,
        namedTemplateTester,
        slotRendererTester,
      ])
    );
  });

  it('composes base and extended renderers for the web component', () => {
    expect(primereactWebcomponentRenderers).toEqual([
      ...primereactRenderers,
      ...primereactExtendedRenderers,
    ]);
    expect(primereactWebcomponentCells).toBe(primereactCells);
  });
});
