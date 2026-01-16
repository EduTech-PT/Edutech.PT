import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Externalizamos todas as libs que estão no importmap do index.html
      // Isto impede que o Vite tente empacotá-las e falhe ao não encontrá-las em node_modules
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-runtime',
        'react-router-dom',
        '@supabase/supabase-js',
        'lucide-react',
        'react-quill',
        'quill',
        'prop-types'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});