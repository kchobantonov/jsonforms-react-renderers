import type { ExtendedLocaleCatalog } from '../util/extendedLocale';

/** German for this package's own strings. See {@link bgExtendedLocale}. */
export const deExtendedLocale: ExtendedLocaleCatalog = {
  'array.addRow': 'Zeile hinzufügen',
  'array.removeSelected': 'Ausgewählte entfernen',
  'grid.loading': 'Tabelle wird geladen...',
  'grid.loadError': 'Die Tabelle konnte nicht geladen werden.',
  'editor.loading': 'Editor wird geladen...',
  'editor.loadError': 'Der Editor konnte nicht geladen werden.',
  'editor.maximize': 'Editor maximieren',
  'editor.restore': 'Editor wiederherstellen',
  'editor.invalidJson': 'Geben Sie gültiges JSON ein.',
  'editor.chooseColor': 'Farbe auswählen',
  'editor.chooseDuration': 'Dauer auswählen',
  'template.loading': 'Template-Engine wird geladen…',
  'template.loadError': 'Die Template-Engine konnte nicht geladen werden.',
  'template.renderError': 'Das Template konnte nicht gerendert werden.',
  'editor.ariaLabel': 'Code-Editor',
  'duration.invalid':
    'Geben Sie eine ISO-8601-Dauer ein, zum Beispiel P2DT3H oder P2W.',
  'additionalProperties.add': 'Hinzufügen',
  'additionalProperties.addLabel': 'Eigenschaft hinzufügen',
  'additionalProperties.addTo': 'Eigenschaft zu {label} hinzufügen',
  'additionalProperties.namePlaceholder': 'Name der Eigenschaft',
  'additionalProperties.rename': 'Umbenennen',
  'additionalProperties.renameNamed': '{name} umbenennen',
  'additionalProperties.save': 'Speichern',
  'additionalProperties.cancel': 'Abbrechen',
  'additionalProperties.delete': 'Löschen',
  'additionalProperties.nameTaken':
    'Die Eigenschaft „{name}“ ist bereits definiert',
  'additionalProperties.nameInvalid':
    'Der Eigenschaftsname „{name}“ ist ungültig',
  'additionalProperties.namePattern':
    'Der Eigenschaftsname muss dem Muster entsprechen: {pattern}',
  'markup.markdownDisabled':
    'Markdown ist für dieses Formular deaktiviert, daher wird der Text so angezeigt, wie er geschrieben wurde.',
  'markup.unsupported':
    'Nicht unterstütztes Markup {markup}. Dieser Renderer-Satz unterstützt „plain“ und „markdown“.',
  'markup.interpolationFailed': 'Konnte nicht ausgewertet werden: {detail}',
};
