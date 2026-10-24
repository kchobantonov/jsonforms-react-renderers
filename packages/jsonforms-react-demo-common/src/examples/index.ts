import './spec';
import { listExamples } from './registry';

// Only spec fixtures (with optional native enhancements) and upstream examples
// are registered by default. Hosts can register additional examples and call
// listExamples(), or pass their own list to renderExample.
const examples = listExamples();

export * from './registry';
export * from './spec';
export default examples;
