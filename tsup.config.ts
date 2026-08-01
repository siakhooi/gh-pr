import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  dts: false,
  format: ['esm'],
  sourcemap: true,
  bundle: true,
  clean: true,
});
