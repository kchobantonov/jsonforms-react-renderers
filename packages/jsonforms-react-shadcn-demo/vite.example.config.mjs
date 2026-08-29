import { defineJsonFormsExampleConfig } from '../../vite/example-config.mjs';
import { fileURLToPath, URL } from 'node:url';

const config = defineJsonFormsExampleConfig({
  packageUrl: import.meta.url,
});

config.resolve.alias = {
  '@': fileURLToPath(new URL('./example', import.meta.url)),
};

export default config;
