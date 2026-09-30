import { defineJsonFormsExampleConfig } from '../../vite/example-config.mjs';
import { fileURLToPath, URL } from 'node:url';

const config = defineJsonFormsExampleConfig({
  packageUrl: import.meta.url,
});

config.resolve.alias = {
  '@jsonforms-react-shadcn-ui': fileURLToPath(
    new URL('./src/components/ui', import.meta.url)
  ),
  '@': fileURLToPath(new URL('./src', import.meta.url)),
};

// Development reads renderer source so rebuilding lib/ cannot break an HMR import.
export default ({ command }) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: [
      ...(command === 'serve'
        ? [
            {
              find: /^@chobantonov\/jsonforms-react-extended-renderers$/,
            replacement: fileURLToPath(new URL('../../packages/jsonforms-react-extended-renderers/src/index.tsx', import.meta.url)),
          },
          {
            find: '@chobantonov/jsonforms-react-renderer-common',
              replacement: fileURLToPath(
                new URL('../../packages/jsonforms-react-renderer-common/src', import.meta.url)
              ),
            },
            {
              find: /^@chobantonov\/jsonforms-react-shadcn-renderers$/,
              replacement: fileURLToPath(
                new URL(
                  '../../packages/jsonforms-react-shadcn-renderers/src/index.tsx',
                  import.meta.url
                )
              ),
            },
            {
              find: /^@chobantonov\/jsonforms-react-shadcn-extended-renderers$/,
              replacement: fileURLToPath(
                new URL(
                  '../../packages/jsonforms-react-shadcn-extended-renderers/src/index.tsx',
                  import.meta.url
                )
              ),
            },
          ]
        : []),
      ...Object.entries(config.resolve.alias).map(([find, replacement]) => ({
        find,
        replacement,
      })),
    ],
  },
});
