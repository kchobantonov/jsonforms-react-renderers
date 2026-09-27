import {
  antdCells,
  antdRenderers,
  MixedRenderer,
  mixedControlTester,
} from '../../src';
import {
  antdButtonRendererTester,
  antdColorControlTester,
  antdCronControlTester,
  antdDurationControlTester,
  antdExtendedCells,
  antdExtendedRenderers,
  antdMaskControlTester,
  antdNullControlTester,
  antdSplitLayoutTester,
} from '../../../jsonforms-react-antd-extended-renderers/src';
import { markupLabelTester } from '../../../jsonforms-react-extended-renderers/src';
import {
  antdWebcomponentCells,
  antdWebcomponentRenderers,
} from '../../../jsonforms-react-antd-webcomponent/src/renderers';
import {
  extendedAgGridTester,
  monacoControlTester,
  sharedSplitLayoutTester,
  spacerRendererTester,
  imageViewRendererTester,
  separatorRendererTester,
  linkRendererTester,
  namedTemplateTester,
  slotRendererTester,
} from '../../../jsonforms-react-extended-renderers/src';

describe('Ant Design renderer registries', () => {
  it('registers the mixed renderer from its dedicated module', () => {
    expect(antdRenderers).toContainEqual({
      tester: mixedControlTester,
      renderer: MixedRenderer,
    });
  });

  /*
    Cells are a separate registry with a separate contract, and the gap
    between them is easy to reintroduce: a control registered only as a
    renderer is unreachable in an array column, which falls back to a text
    cell without saying anything. This pins which controls are reachable
    there - and that the code editor is not one of them.
  */
  it('contains the complete extended cell set', () => {
    expect(antdExtendedCells.map(({ tester }) => tester)).toEqual([
      antdColorControlTester,
      antdCronControlTester,
      antdDurationControlTester,
      antdMaskControlTester,
      antdNullControlTester,
    ]);
    expect(
      antdExtendedCells.some((entry) => entry.tester === monacoControlTester)
    ).toBe(false);
  });

  it('contains the complete extended renderer set', () => {
    expect(antdExtendedRenderers.map(({ tester }) => tester)).toEqual([
      extendedAgGridTester,
      monacoControlTester,
      antdButtonRendererTester,
      antdColorControlTester,
      /*
        The markup Label appears TWICE, and must: the entry here carries
        antd's typography, the one further down carries none. Both rank 3, and
        JSON Forms breaks a tie with lodash `maxBy`, which returns the first
        maximum - so the antd binding wins by being earlier in the array.
      */
      markupLabelTester,
      antdCronControlTester,
      antdDurationControlTester,
      antdMaskControlTester,
      antdNullControlTester,
      antdSplitLayoutTester,
      sharedSplitLayoutTester,
      /*
        `horizontalColumnsLayoutTester` is deliberately absent. Its renderer
        encoded width as `options.columns` against a fixed 16-column grid, and
        at rank 3 it outranked the base HorizontalLayout - so registering it
        would stop the portable sizing model from ever taking effect. It stays
        exported for a host that wants the old behaviour. See Adjustment 21.
      */
      spacerRendererTester,
      imageViewRendererTester,
      separatorRendererTester,
      linkRendererTester,
      markupLabelTester,
      /*
        The TypeScript form first - it is selected by `typeof template ===
        'function'` and has to beat the string engines - then one entry per
        language, then the diagnostic fallback. These testers are built by
        `templateLangTester(lang)`, so they are compared by position here
        rather than by imported identity.
      */
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      namedTemplateTester,
      slotRendererTester,
    ]);
  });

  it('composes base and extended renderers for the web component', () => {
    expect(antdWebcomponentRenderers).toEqual([
      ...antdRenderers,
      ...antdExtendedRenderers,
    ]);
    /*
      Cells are composed the same way now, and were not: the web component
      handed out bare `antdCells`, so an embedded form's colour and duration
      columns rendered as text while the same fields in the same form rendered
      as pickers. The identity assertion this replaces is what let that stand.
    */
    expect(antdWebcomponentCells).toEqual([...antdCells, ...antdExtendedCells]);
  });
});
