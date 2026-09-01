import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AntdClearValueButton } from '../../src/antd-controls/AntdClearValueButton';

describe('Ant Design clear value button', () => {
  it.each([0, false, 'value'])('renders for populated data %s', (data) => {
    const markup = renderToStaticMarkup(
      <AntdClearValueButton data={data} enabled onClear={() => undefined} />
    );

    expect(markup).toContain('aria-label="Clear value"');
  });

  it.each([undefined, null, ''])(
    'does not render for empty data %s',
    (data) => {
      const markup = renderToStaticMarkup(
        <AntdClearValueButton data={data} enabled onClear={() => undefined} />
      );

      expect(markup).not.toContain('aria-label="Clear value"');
    }
  );
});
