import { config } from 'dotenv';
import { vi } from 'vitest';

// Load environment variables from .env file for testing
config();

// Set default test environment variables if not present
if (!process.env.MNEMONIC) {
  process.env.MNEMONIC = 'test test test test test test test test test test test junk';
}

if (!process.env.RPC_ENDPOINT) {
  process.env.RPC_ENDPOINT = 'http://localhost:26657';
}

if (!process.env.EVM_RPC_ENDPOINT) {
  process.env.EVM_RPC_ENDPOINT = 'http://localhost:8545';
}

if (!process.env.PORT) {
  process.env.PORT = '8088';
}

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: console.error, // Keep error for debugging
};
