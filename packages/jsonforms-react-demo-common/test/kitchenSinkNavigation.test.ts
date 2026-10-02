import { expect, it } from 'vitest';
import uischema from '@chobantonov/jsonforms-extended-spec/examples/kitchen-sink/uischema.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/kitchen-sink/translations.json';

it('keeps all kitchen-sink sections in four localized steps with short tab lists', () => {
  const navigation = uischema.elements[1] as any;
  expect(navigation.options).toMatchObject({
    variant: 'stepper',
    showNavButtons: true,
  });
  expect(navigation.elements).toHaveLength(4);
  const sections: string[] = [];
  for (const step of navigation.elements) {
    expect(step.options.showValidationIndicator).toBe(true);
    for (const locale of ['en', 'bg'] as const) {
      expect(
        (translations[locale] as Record<string, string>)[`${step.i18n}.label`]
      ).toBeTruthy();
    }
    const tabs = step.elements[0];
    expect(tabs.type).toBe('Categorization');
    expect(tabs.elements.length).toBeGreaterThanOrEqual(2);
    expect(tabs.elements.length).toBeLessThanOrEqual(4);
    sections.push(...tabs.elements.map((tab: any) => tab.i18n));
  }
  expect(sections.sort()).toEqual(
    [
      'identity',
      'contactTab',
      'preferences',
      'schedule',
      'teamTab',
      'gridTeamTab',
      'collections',
      'documents',
      'workSample',
      'integration',
      'agreements',
    ].sort()
  );
});
