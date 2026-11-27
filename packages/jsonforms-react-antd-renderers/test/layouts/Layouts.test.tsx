import { horizontalLayoutTester, verticalLayoutTester } from '../../src';
import { runRendererContract } from '../support/rendererContract';

runRendererContract('HorizontalLayout', horizontalLayoutTester);
runRendererContract('VerticalLayout', verticalLayoutTester);
