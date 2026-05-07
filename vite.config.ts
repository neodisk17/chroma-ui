import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

// Native/Node modules that should not be bundled
const electronExternals = [
  'electron',
  'electron-updater',
  'electron-log',
  'keytar',
  'chromadb',
  'onnxruntime-node',
  '@huggingface/transformers',
];


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry file
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            minify: isProduction ? 'esbuild' : false,
            sourcemap: !isProduction,
            rollupOptions: {
              external: electronExternals,
              output: {
                format: 'cjs'
              },
            }
          }
        }
      },
      {
        // Preload script
        entry: 'electron/preload.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            minify: isProduction ? 'esbuild' : false,
            sourcemap: !isProduction,
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs'
              }
            }
          }
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared')
    }
  },
  build: {
    sourcemap: !isProduction,
    minify: isProduction ? 'esbuild' : false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return;
          if (['react', 'react-dom', 'react-router-dom'].some(p => id.includes(`/node_modules/${p}/`))) return 'vendor-react';
          if (id.includes('@radix-ui/')) return 'vendor-ui';
          if (['@tanstack/react-query', 'zustand', 'zod'].some(p => id.includes(`/node_modules/${p}/`))) return 'vendor-data';
          if (id.includes('ag-grid')) return 'vendor-grid';
          if (id.includes('recharts')) return 'vendor-charts';
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000
  }
});
