import typescript from 'rollup-plugin-typescript2';
import cleanup from 'rollup-plugin-cleanup';
import { visualizer } from 'rollup-plugin-visualizer';

const packageJson = require('./package.json');

const external = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
  'react',
  'react-dom',
  'react-dom/client',
];

export default [
  {
    input: 'src/index.tsx',
    output: {
      file: packageJson.module,
      format: 'esm',
      sourcemap: true,
    },
    external,
    plugins: [
      typescript({ clean: true }),
      cleanup({ extensions: ['js', 'ts', 'jsx', 'tsx'] }),
      visualizer({ open: false }),
    ],
  },
  {
    input: 'src/register.ts',
    output: {
      file: 'dist/register.js',
      format: 'esm',
      sourcemap: true,
    },
    external,
    plugins: [
      typescript({ clean: true }),
      cleanup({ extensions: ['js', 'ts', 'jsx', 'tsx'] }),
    ],
  },
];
