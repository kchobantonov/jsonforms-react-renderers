import { horizontalLayoutTester, verticalLayoutTester } from '../../src';
import { runRendererContract } from './rendererContract';

runRendererContract('HorizontalLayout', horizontalLayoutTester);
runRendererContract('VerticalLayout', verticalLayoutTester);
