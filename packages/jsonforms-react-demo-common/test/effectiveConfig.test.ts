import { exampleElements } from './exampleElements';
import { describe, expect, test } from 'vitest';
import examples from '../src/examples';

/** Mirrors App.tsx: the example's config is merged under the settings toggles. */
const effective = (
  configOptions: Record<string, unknown>,
  exampleConfig: Record<string, unknown> | undefined,
  key: string
) => Boolean(configOptions[key] ?? exampleConfig?.[key]);

describe('settings toggles reflect what the form is using', () => {
  const exampleConfig = { showUnfocusedDescription: true, restrict: true };

  test('an option the example sets reads as on before anything is touched', () => {
    // The bug: reading only configOptions showed off while descriptions were
    // visible, and flipping twice was the only way to make them agree.
    expect(effective({}, exampleConfig, 'showUnfocusedDescription')).toBe(true);
  });

  test('the user can still turn it off, and that wins', () => {
    expect(
      effective(
        { showUnfocusedDescription: false },
        exampleConfig,
        'showUnfocusedDescription'
      )
    ).toBe(false);
  });

  test('an option neither sets reads as off', () => {
    expect(effective({}, exampleConfig, 'hideRequiredAsterisk')).toBe(false);
    expect(effective({}, undefined, 'hideRequiredAsterisk')).toBe(false);
  });

  /*
    The empty-name switch is the one where getting this wrong is most visible:
    the additional-properties example turns it on in its own config, so the
    switch has to read as on before anything is touched - and turning it off
    has to win, because that is how a reader compares the two behaviours.
  */
  test('the empty-name switch follows the example that sets it', () => {
    const additional = examples.find(
      (e) => e.name === 'spec-additional-properties'
    );
    const config = additional!.config as Record<string, unknown>;
    expect(config.allowEmptyPropertyNames).toBe(true);
    expect(effective({}, config, 'allowEmptyPropertyNames')).toBe(true);
    expect(
      effective(
        { allowEmptyPropertyNames: false },
        config,
        'allowEmptyPropertyNames'
      )
    ).toBe(false);
  });

  test('a control option still overrides whatever the switch says', () => {
    // The switch writes global config; section 18 gives the element the last
    // word, which is why the example carries an explicit `false` on one control.
    const additional = examples.find(
      (e) => e.name === 'spec-additional-properties'
    );
    const quota = exampleElements(additional!.uischema as any).find(
      (element: any) => element.scope === '#/properties/quota'
    );
    expect(quota.options.allowEmptyPropertyNames).toBe(false);
  });

  test('the numeric example really does set the options that exposed this', () => {
    const numeric = examples.find((e) => e.name === 'spec-numeric-controls');
    const config = numeric!.config as Record<string, unknown>;
    expect(config.showUnfocusedDescription).toBe(true);
    expect(config.restrict).toBe(true);
    expect(effective({}, config, 'showUnfocusedDescription')).toBe(true);
  });
});
