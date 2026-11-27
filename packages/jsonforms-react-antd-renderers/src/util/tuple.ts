// Compatibility export; implementation is shared by all renderer families.
export {
  tupleDefinition,
  tupleControlTester,
  resolveTupleSchema,
  tupleInitialValue,
  tupleEmptyValue,
  UNCONSTRAINED_TYPES,
  tupleRenderSchema,
  isComplexTupleSchema,
  tupleFieldOwnsLabel,
} from '@chobantonov/jsonforms-react-renderer-common/tuple/tupleSchema';
export type {
  TupleSchema,
  TupleDefinition,
} from '@chobantonov/jsonforms-react-renderer-common/tuple/tupleSchema';
