import type { ExtendedLocaleCatalog } from '../util/extendedLocale';

/**
 * Bulgarian for this package's own strings.
 *
 * ```ts
 * import { registerExtendedLocale, bgExtendedLocale } from '@chobantonov/jsonforms-react-extended-renderers';
 * registerExtendedLocale('bg', bgExtendedLocale);
 * ```
 *
 * The `color.placeholder.*` keys are deliberately absent: they are notations
 * (`#RRGGBB`, `rgb(r, g, b)`), not prose, and translating them would show a
 * pattern the control does not accept.
 */
export const bgExtendedLocale: ExtendedLocaleCatalog = {
  'array.addRow': 'Добавяне на ред',
  'array.removeSelected': 'Премахване на избраните',
  'grid.loading': 'Таблицата се зарежда...',
  'grid.loadError': 'Таблицата не може да бъде заредена.',
  'editor.loading': 'Редакторът се зарежда...',
  'editor.loadError': 'Редакторът не може да бъде зареден.',
  'editor.maximize': 'Максимизиране на редактора',
  'editor.restore': 'Възстановяване на редактора',
  'editor.invalidJson': 'Въведете валиден JSON.',
  'editor.chooseColor': 'Изберете цвят',
  'editor.chooseDuration': 'Изберете продължителност',
  'template.loading': 'Шаблонният механизъм се зарежда…',
  'template.loadError': 'Шаблонният механизъм не може да бъде зареден.',
  'template.renderError': 'Шаблонът не може да бъде изобразен.',
  'editor.ariaLabel': 'Редактор на код',
  'duration.invalid':
    'Въведете продължителност по ISO 8601, например P2DT3H или P2W.',
  'additionalProperties.add': 'Добавяне',
  'additionalProperties.addLabel': 'Добавяне на свойство',
  'additionalProperties.addTo': 'Добавяне на свойство към {label}',
  'additionalProperties.namePlaceholder': 'Име на свойството',
  'additionalProperties.rename': 'Преименуване',
  'additionalProperties.renameNamed': 'Преименуване на {name}',
  'additionalProperties.save': 'Запазване',
  'additionalProperties.cancel': 'Отказ',
  'additionalProperties.delete': 'Изтриване',
  'additionalProperties.nameTaken': 'Свойството „{name}“ вече е дефинирано',
  'additionalProperties.nameInvalid': 'Името „{name}“ не е допустимо',
  'additionalProperties.namePattern':
    'Името на свойството трябва да съответства на шаблона: {pattern}',
  'markup.markdownDisabled':
    'Markdown е изключен за тази форма, затова текстът се показва както е написан.',
  'markup.unsupported':
    'Неподдържано маркиране {markup}. Този набор от рендери поддържа „plain“ и „markdown“.',
  'markup.interpolationFailed': 'Неуспешно изчисляване: {detail}',
};
