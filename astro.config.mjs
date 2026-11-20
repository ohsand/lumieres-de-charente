import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://www.lumieresdecharente.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
