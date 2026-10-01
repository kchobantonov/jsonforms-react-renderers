import { defineJsonFormsExampleConfig } from '../../vite/example-config.mjs';
import { fileURLToPath } from 'node:url';

const config = defineJsonFormsExampleConfig({
  packageUrl: import.meta.url,
});

// Read source during development so renderer edits appear without rebuilding lib/.
export default ({ command }) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias:
      command === 'serve'
        ? [
            {
              find: /^@chobantonov\/jsonforms-react-extended-renderers$/,
              replacement: fileURLToPath(
                new URL(
                  '../../packages/jsonforms-react-extended-renderers/src/index.tsx',
                  import.meta.url
                )
              ),
            },
            {
              find: '@chobantonov/jsonforms-react-renderer-common',
              replacement: fileURLToPath(
                new URL(
                  '../../packages/jsonforms-react-renderer-common/src',
                  import.meta.url
                )
              ),
            },
            ...['antd-renderers', 'antd-extended-renderers'].map((name) => ({
              find: new RegExp(`^@chobantonov/jsonforms-react-${name}$`),
              replacement: fileURLToPath(
                new URL(
                  `../../packages/jsonforms-react-${name}/src/index.${
                    name === 'antd-renderers' ? 'ts' : 'tsx'
                  }`,
                  import.meta.url
                )
              ),
            })),
          ]
        : [],
  },
});
