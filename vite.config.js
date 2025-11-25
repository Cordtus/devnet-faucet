import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [vue(), wasm(), topLevelAwait()],
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  json: {
    stringify: true,
  },
  optimizeDeps: {
    include: ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
    exclude: [],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          'vue-vendor': ['vue', '@tanstack/vue-query'],
          'cosmos-vendor': [
            '@cosmjs/crypto',
            '@cosmjs/encoding',
            '@cosmjs/proto-signing',
            '@cosmjs/stargate',
            'cosmjs-types',
          ],
          'wallet-vendor': ['@reown/appkit', '@reown/appkit-adapter-wagmi', 'viem'],
          'crypto-vendor': [
            'bip39',
            'bip32',
            'tiny-secp256k1',
            '@noble/curves',
            '@noble/hashes',
            'bech32',
          ],
          'utils-vendor': ['ethers', 'long'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ['faucet.basementnodes.ca', 'localhost'],
    proxy: {
      '/send': 'http://localhost:8088',
      '/config.json': 'http://localhost:8088',
      '/balance': 'http://localhost:8088',
      '/transaction': 'http://localhost:8088',
    },
  },
});
