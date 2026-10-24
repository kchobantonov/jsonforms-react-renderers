/**
 * Default messages for strings this package renders. Every one goes through the
 * JSON Forms translator, so a host can override any of them per locale.
 */
export const extendedI18nDefaults = {
  'array.addRow': 'Add row',
  'array.removeSelected': 'Remove selected',
  'grid.loading': 'Loading data grid...',
  'grid.loadError': 'Unable to load the data grid.',
  'editor.loading': 'Loading editor...',
  'editor.loadError': 'Unable to load the editor.',
  'editor.maximize': 'Maximize editor',
  'editor.restore': 'Restore editor',
  'editor.invalidJson': 'Enter valid JSON.',
  // `{count}` is substituted by the caller, the way the composite summaries do.
  'editor.languageErrors':
    'Code contains {count} errors. Review the marked locations in the editor.',
  'editor.languageError':
    'Code contains 1 error. Review the marked location in the editor.',
  'editor.chooseColor': 'Choose a color',
  'editor.chooseDuration': 'Choose a duration',
  // The color control's entry hint must "reflect the configured
  // representation" (spec section 18), so there is one per save format rather
  // than a single `#RRGGBB`. They are syntax rather than prose, but they go
  // through the translator like every other rendered string (Adjustment 6) so
  // a locale that writes its channel names differently can say so. There is no
  // `hsl` entry because there is no `hsl` output; see Adjustment 8.1.
  'color.placeholder.hex': '#RRGGBB',
  'color.placeholder.hex3': '#RGB',
  'color.placeholder.rgb': 'rgb(r, g, b)',
  'color.placeholder.hsb': 'hsb(h, s%, b%)',
  // Named by the specification itself: the guidance shown when three-digit hex
  // output is selected and the edit would carry transparency.
  'color.hex3Transparency':
    'Three-digit hex cannot store transparency. Enter an opaque color, or clear the value.',

  // Generic additional-properties editor. The antd package has its own
  // `additionalProperties.*` keys for the renderer it draws; these are the
  // same strings for the unstyled fallback, and are separate because neither
  // package depends on the other.
  'additionalProperties.add': 'Add',
  'additionalProperties.addLabel': 'Add property',
  'additionalProperties.addTo': 'Add property to {label}',
  'additionalProperties.namePlaceholder': 'Property name',
  'additionalProperties.rename': 'Rename',
  'additionalProperties.renameNamed': 'Rename {name}',
  'additionalProperties.save': 'Save',
  'additionalProperties.cancel': 'Cancel',
  'additionalProperties.delete': 'Delete',
  'additionalProperties.nameTaken': "Property '{name}' already defined",
  'additionalProperties.nameInvalid': "Property name '{name}' is invalid",
  'additionalProperties.namePattern':
    'Property name must match pattern: {pattern}',

  // Template engines, which arrive in their own chunk. Loading and the two
  // failures are separate keys because they send the reader to different
  // places: a chunk that never arrived, or a template that threw.
  'template.loading': 'Loading template engine…',
  'template.loadError': 'The template engine could not be loaded.',
  'template.renderError': 'The template could not be rendered.',
  // The Monaco control's accessible name when the control has no label.
  'editor.ariaLabel': 'Code editor',
  // Shown under the duration control for text that is not a duration. Names
  // both spellings, since the picker can produce either.
  'duration.invalid': 'Enter an ISO 8601 duration, for example P2DT3H or P2W.',
  // Shown beside the text when a markup request cannot be honoured. The text
  // is still rendered, so these explain why it looks unformatted rather than
  // standing in for it. `{markup}` is substituted by the caller.
  'markup.markdownDisabled':
    'Markdown is turned off for this form, so this text is shown as written.',
  'markup.unsupported':
    'Unsupported markup {markup}. This renderer set implements "plain" and "markdown".',
  // An expression that could not be resolved. `{detail}` carries the
  // evaluator's own message, which names the cause - an unknown identifier, a
  // missing key, a type mismatch - better than anything this layer could
  // invent. Developer-facing, shown beside the text rather than instead of it.
  'markup.interpolationFailed': 'Could not resolve: {detail}',
};

export type ExtendedI18nKey = keyof typeof extendedI18nDefaults;
