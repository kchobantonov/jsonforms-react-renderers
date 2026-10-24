// Compatibility export; implementation is shared by all renderer families.
export {
  resolveItemSchema,
  arrayChoicesOf,
  hasStringItems,
  isMultiSelectControl,
  isChipsControl,
  asArrayValue,
  sameChoice,
  isSelected,
  addChoice,
  removeChoiceAt,
  removeChoice,
  canAddChoice,
  canRemoveChoice,
} from '@chobantonov/jsonforms-react-renderer-common/arrayChoices';
export type {
  ArrayChoice,
  ArrayChoiceLimits,
} from '@chobantonov/jsonforms-react-renderer-common/arrayChoices';
