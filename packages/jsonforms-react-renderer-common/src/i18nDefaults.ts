export const i18nDefaults = {
  'collection.deleteSelected': 'Delete selected rows',
  'collection.deleteSelectedMessage': 'Delete the selected rows and their data?',
  'collection.selectPage': 'Select all rows on this page',
  'collection.selectRow': 'Select row {index}',
  'collection.pagination': 'Pagination',
  'collection.pageSize': 'Items per page',
  'collection.previous': 'Previous page',
  'collection.next': 'Next page',
  'collection.showDetails': 'Show details',
  'collection.hideDetails': 'Hide details',
  'collection.editDetails': 'Edit details',
  'collection.selectItem': 'Select an item to view its details.',

  'enum.none': 'None',
  // Shown when a search query matches no choice. The specification requires a
  // searchable renderer to define its empty-result behaviour, so this is part
  // of the contract rather than decoration.
  'enum.noMatches': 'No matching choices',
  // Chips: the hint in the free-entry box. Entry is committed on Enter, so the
  // hint says so rather than leaving a partial token looking committed.
  'chips.addPlaceholder': 'Type a value and press Enter',
  // Group data-presence indicator. Says "data", never "edits": the marker is
  // computed from current data, so it appears for server-supplied values
  // nobody touched. See docs/jsonforms-extended-ui-model-adjustments.md §4.
  'group.dataIndicator': 'Section contains data',
  // Container error indicator. Singular/plural keys with a {count} placeholder,
  // matching composite.summary.item(s): this works with a plain translator,
  // where a single ICU pattern would render its own syntax. The count is what
  // the indicator may show after validationMode filtering, not the raw total.
  'validation.showMore': 'Show {count} more',
  'validation.showLess': 'Show less',
  'validation.containerError': '{count} error in this section',
  'validation.containerErrors': '{count} errors in this section',
  // Used when showValidationIndicatorCount is off.
  'validation.containerHasErrors': 'This section contains errors',
  // A refused file selection. Names the file, because the message sits beside
  // the attachment that is still committed - without the name it reads as an
  // error about *that* file rather than the one that was turned away.
  'file.rejected': '"{name}" was not attached: {reason}',
  'file.select': 'Select File',

  // Clear affordance shared by the input controls
  'control.clearValue': 'Clear value',
  // Announced for a control that is showing a position without holding a
  // value - the slider sitting at its default. Same words as boolean.notSet
  // and composite.summary.unset, but its own key, so a catalog can phrase the
  // three differently where the grammar needs it to.
  'control.notSet': 'Not set',

  // Password reveal. The name states the action the control will perform, not
  // the state it is in.
  'password.show': 'Show password',
  'password.hide': 'Hide password',

  // Boolean controls. "Not set" is for a widget that cannot render an
  // indeterminate state, and for data that is not a boolean at all.
  'boolean.notSet': 'Not set',
  'boolean.invalid': 'Not a true or false value',

  // Array item and list-with-detail headers
  'array.indexLabel': 'Index',

  // Categorization stepper navigation
  'categorization.next': 'Next',
  'categorization.previous': 'Previous',

  // Shared destructive-change confirmation (section 14). One set of strings
  // for every renderer, because the policy is shared: a delete reads the same
  // whether it removes a table row, a tree node or a dynamic property.
  'confirm.delete.title': 'Delete this value?',
  'confirm.delete.message':
    'The value will be removed. This cannot be undone from here.',
  'confirm.typeChange.title': 'Change the type?',
  'confirm.typeChange.message':
    'The current value does not fit the new type and will be discarded.',
  'confirm.branchChange.title': 'Change the selection?',
  'confirm.branchChange.message':
    'Data that the new selection does not describe will be discarded.',
  'confirm.accept': 'Yes',
  'confirm.decline': 'No',

  // oneOf / anyOf branch switching
  'combinator.clearFormTitle': 'Clear form?',
  'combinator.clearFormMessage':
    'Your data will be cleared if you navigate away from this tab. Do you want to proceed?',
  'combinator.clearFormConfirm': 'Yes',
  'combinator.clearFormDecline': 'No',
  'combinator.cancel': 'Cancel',

  // Additional (dynamic) properties editor
  'additionalProperties.title': 'Additional Properties',
  'additionalProperties.namePlaceholder': 'Property name',
  'additionalProperties.add': 'Add property',
  'additionalProperties.addTo': 'Add property to {label}',
  'additionalProperties.rename': 'Rename property',
  'additionalProperties.renameNamed': 'Rename {name}',
  'additionalProperties.renameTitle': 'Rename property',
  'additionalProperties.renameConfirm': 'Rename',
  'additionalProperties.delete': 'Delete property',
  'additionalProperties.deleteNamed': 'Delete {name}',
  'additionalProperties.deleteBlocked':
    'The schema requires this property to remain.',
  // Naming a dynamic property. Only the schema constrains a name now: any
  // character is permitted, and a name a data path cannot address is edited in
  // a form of its own instead of being refused. See Adjustment 14.
  'additionalProperties.nameRequired': 'Enter a property name.',
  'additionalProperties.nameTaken': "'{name}' is already defined.",
  'additionalProperties.nameInvalid':
    "'{name}' is not a permitted property name here.",
  // A name the schema's patternProperties do not admit. Distinct from
  // nameInvalid, which is about a name no data path could address at all.
  'additionalProperties.namePattern':
    'The property name does not match an allowed pattern.',

  // Mixed-value control: tree, type selector and their actions
  'mixed.typeLabel': 'Value type',
  'mixed.typePlaceholder': 'Select a type',
  'mixed.required': 'Required',
  'mixed.treeLabel': 'Value structure',
  'mixed.searchLabel': 'Search value tree',
  'mixed.searchPlaceholder': 'Search tree...',
  'mixed.showPrimitives': 'Show primitives',
  'mixed.hidePrimitives': 'Hide primitives',
  'mixed.rename': 'Rename',
  // Refused rename in the tree: a fixed property, or one the form is not
  // permitted to edit. Says the property cannot be renamed, not that the name
  // is wrong - the name was never the problem.
  'mixed.renameBlocked': 'This property cannot be renamed.',
  'mixed.delete': 'Delete',

  // Cron schedule picker. Six fields: second, minute, hour, day of month,
  // month, day of week - Spring's dialect, not Unix cron's five.
  'cron.expression': 'Expression',
  'cron.choose': 'Choose a schedule',
  'cron.ok': 'Apply',
  'cron.cancel': 'Cancel',
  'cron.repeats': 'Repeats',
  // The period selector's placeholder, for a property with no schedule yet.
  // A period is a lens on a schedule, so it asserts nothing until one is
  // chosen; see docs/jsonforms-extended-ui-model-adjustments.md §39.
  'cron.chooseRepeats': 'Choose how often',
  'cron.period.second': 'Every second',
  'cron.period.minute': 'Every minute',
  'cron.period.hour': 'Hourly',
  'cron.period.day': 'Daily',
  'cron.period.week': 'Weekly',
  'cron.period.month': 'Monthly',
  'cron.period.year': 'Yearly',
  'cron.second': 'Seconds',
  'cron.minute': 'Minutes',
  'cron.hour': 'Hours',
  'cron.dayOfMonth': 'Days of month',
  'cron.month': 'Months',
  'cron.dayOfWeek': 'Days of week',
  // A field's picker with nothing chosen, which means every value.
  'cron.every': 'Every',
  // Shown in place of a field's picker when its value is syntax a list cannot
  // state - `L`, `W`, `#`. The field is edited as text and left as it was.
  'cron.advanced':
    'Edited as text: this field uses syntax a list cannot state.',
  'cron.error.sixFields':
    'A schedule has six fields: second, minute, hour, day of month, month, day of week.',
  'cron.error.second': 'The seconds field is not valid (0-59).',
  'cron.error.minute': 'The minutes field is not valid (0-59).',
  'cron.error.hour': 'The hours field is not valid (0-23).',
  'cron.error.dayOfMonth': 'The day-of-month field is not valid (1-31).',
  'cron.error.month': 'The month field is not valid (1-12, or JAN-DEC).',
  'cron.error.dayOfWeek':
    'The day-of-week field is not valid (0-7, or SUN-SAT).',

  // Duration picker components
  'duration.weeks': 'Weeks',
  'duration.years': 'Years',
  'duration.months': 'Months',
  'duration.days': 'Days',
  'duration.hours': 'Hours',
  'duration.minutes': 'Minutes',
  'duration.seconds': 'Seconds',
  'duration.addUnit': 'Add unit',
  'duration.removeUnit': 'Remove {unit}',
  'duration.modeComponents': 'Years to seconds',
  'duration.modeWeeks': 'Weeks',
  'duration.ok': 'Apply',
  'duration.cancel': 'Cancel',
  // Tuple (positional array) control.
  //
  // `tuple.position` takes the displayed position as a parameter rather than
  // gluing a number onto an English word, which section 18 asks for by name:
  // "position-label translation accepts the displayed position as a parameter
  // rather than concatenating a fixed English word with a number". Numbering
  // shown to a reader is one-based; the data path stays zero-based.
  'tuple.position': 'Item {position}',
  'tuple.additionalItems': 'Additional items',
  'tuple.add': 'Add item',
  'tuple.delete': 'Delete {label}',
  // The configuration diagnostic section 18 requires instead of guessing a
  // positional count.
  'tuple.configuration':
    'Tuple presentation requires positional schemas, or equal non-negative minItems and maxItems on an array.',
  'tuple.forbidden': 'No value is permitted at this position.',
  // Drafts held because the contract forbids inventing a value. Each names the
  // position the reader has to fill in rather than just refusing the edit.
  'tuple.missingPosition': 'Enter Item {position} first.',
  'tuple.valueRequired': 'Enter a value for this position.',
  'tuple.initialType': 'The additional item needs an explicit default or type.',

  // Composite (object/array) table cells
  'composite.summary.item': '{count} item',
  'composite.summary.items': '{count} items',
  'composite.summary.details': 'View details',
  'composite.summary.unset': 'Not set',
  'composite.summary.more': '(+{count} more)',
  'composite.edit': 'Edit {label}',
  'composite.remove': 'Remove {label}',
  'composite.detailsTitle': 'Details',
  'composite.itemsLabel': 'items',
  'composite.detailsLabel': 'details',
  'composite.empty': 'Clear',
  'composite.emptyTooltip': 'Clear contents, keeping the object or array.',
  'composite.cancel': 'Cancel',
  'composite.cancelTooltip': 'Discard changes and close.',
  'composite.apply': 'Apply',
  'composite.applyTooltip': 'Apply changes and close.',
  'composite.applyConflict':
    'This value changed elsewhere while the dialog was open. Cancel and reopen it.',
};

/**
 * Every string this package can draw.
 *
 * Declared here rather than beside the hook that consumes it, because the
 * locale bundles in `../locale` are typed by it and importing it from
 * `translate.ts` would cycle back through `rendererLocale.ts`.
 */
export type I18nKey = keyof typeof i18nDefaults;
