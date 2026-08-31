import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/gpp2/' : '/',
  build: {
    sourcemap: false,
    assetsInlineLimit: 0
  }
});
