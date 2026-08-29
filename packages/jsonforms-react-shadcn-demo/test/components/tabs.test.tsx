import React from 'react';
import { renderMarkup } from '../render';
import { JsonFormsTabs } from '../../example/components/jsonforms/tabs-adapter';

describe('Shadcn Tabs adapter', () => {
  it('composes the individual upstream Tabs components', () => {
    const markup = renderMarkup(
      <JsonFormsTabs
        items={[{ content: 'Content', label: 'General', value: 'general' }]}
        onValueChange={() => undefined}
        value='general'
      />
    );
    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('General');
    expect(markup).toContain('Content');
  });
});
