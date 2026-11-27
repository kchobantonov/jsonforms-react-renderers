import { anyOfStringOrEnumControlTester } from '../../src';
import { runRendererContract } from '../support/rendererContract';

runRendererContract('AnyOfStringOrEnumControl', anyOfStringOrEnumControlTester);
