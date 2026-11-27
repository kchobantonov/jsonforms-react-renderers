import { additionalPropertyClearingContract } from '../../../jsonforms-react-renderer-common/test/contracts/additionalPropertyClearing';
import { shadcnRenderers, shadcnCells } from '../../src';

additionalPropertyClearingContract(shadcnRenderers, shadcnCells);
