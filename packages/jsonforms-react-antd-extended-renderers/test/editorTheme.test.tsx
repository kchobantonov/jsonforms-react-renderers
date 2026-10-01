import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { ConfigProvider, theme as antTheme } from 'antd';
import { useEditorAppearance } from '@chobantonov/jsonforms-react-extended-renderers';
import { useAntdEditorTheme } from '../src/renderers/useAntdEditorTheme';

const render = (node: React.ReactElement) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  return () => act(() => root.unmount());
};

describe('useAntdEditorTheme', () => {
  const capture = (dark: boolean) => {
    let result: any;
    const Probe = () => {
      result = useAntdEditorTheme();
      return null;
    };
    const unmount = render(
      <ConfigProvider
        theme={{
          algorithm: dark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        }}
      >
        <Probe />
      </ConfigProvider>
    );
    unmount();
    return result;
  };

  // Regression: antd's seed leaves colorBgBase as '', and `??` does not fall
  // back on empty strings - isDark came back undefined and the editors silently
  // fell through to the DOM heuristic instead of following antd.
  it('reports dark for antd darkAlgorithm', () => {
    expect(capture(true).isDark).toBe(true);
  });

  it('reports light for antd defaultAlgorithm', () => {
    expect(capture(false).isDark).toBe(false);
  });

  it('always yields a usable surface background', () => {
    for (const dark of [true, false]) {
      const { background } = capture(dark);
      expect(typeof background).toBe('string');
      expect(background.trim()).not.toBe('');
    }
  });

  it('uses different backgrounds per mode', () => {
    expect(capture(true).background).not.toBe(capture(false).background);
  });
});

describe('useEditorAppearance', () => {
  const capture = (explicitTheme?: string, hostIsDark?: boolean) => {
    let result: any;
    const Probe = () => {
      const ref = useRef<HTMLDivElement>(null);
      result = useEditorAppearance(ref, explicitTheme, hostIsDark);
      return <div ref={ref} />;
    };
    const unmount = render(<Probe />);
    unmount();
    return result;
  };

  // Regression: the host design system must win over the DOM luminance guess,
  // which silently returns light when nothing paints an opaque background.
  it('prefers the host design system over the DOM heuristic', () => {
    expect(capture(undefined, true).isDark).toBe(true);
    expect(capture(undefined, false).isDark).toBe(false);
  });

  it('lets an explicit uischema theme override the host', () => {
    expect(capture('light', true).isDark).toBe(false);
    expect(capture('dark', false).isDark).toBe(true);
  });

  it("'system' ignores the host and follows the environment", () => {
    expect(capture('system', true).isDark).toBe(false);
  });

  // Regression: 'vs-dark' is Monaco vocabulary and must not leak out of the
  // shared hook - AG Grid consumes the same value.
  it('returns a framework-neutral result, not a Monaco theme name', () => {
    const appearance = capture(undefined, true);
    expect(appearance).toEqual({ isDark: true, customTheme: undefined });
    expect(Object.values(appearance)).not.toContain('vs-dark');
  });

  it('passes a custom theme name through untouched', () => {
    expect(capture('my-monaco-theme', true).customTheme).toBe(
      'my-monaco-theme'
    );
  });
});
