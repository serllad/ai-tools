import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          codemirror: [
            'codemirror',
            '@codemirror/state', '@codemirror/view', '@codemirror/language', '@codemirror/commands',
            '@codemirror/lang-json', '@codemirror/lang-xml', '@codemirror/lang-javascript',
            '@codemirror/lang-html', '@codemirror/lang-css', '@codemirror/lang-python',
            '@codemirror/lang-markdown', '@codemirror/lang-yaml', '@codemirror/lang-sql'
          ]
        }
      }
    }
  }
});
