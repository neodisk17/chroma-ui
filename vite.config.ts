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
  'electron-store',
  'keytar',
  'chromadb',
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
              }
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
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-tooltip', '@radix-ui/react-popover'],
          'vendor-data': ['@tanstack/react-query', 'zustand', 'zod'],
          'vendor-grid': ['ag-grid-community', 'ag-grid-react'],
          'vendor-charts': ['recharts'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000
  }
});
