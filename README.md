# Devnet Faucet

A dual-chain faucet for distributing native tokens on Cosmos SDK chains with EVM support. Built for frequently-resetting devnets with comprehensive rate limiting.

## Features

- **Dual Environment Support**: Simultaneous Cosmos SDK + EVM native token distribution
- **Single Native Token**: Distributes the chain's native token to both Bech32 and EVM addresses
- **Intelligent Rate Limiting**: Per-address (1/24h) and per-IP (10/24h) with SQLite persistence
- **Secure Key Management**: Mnemonic-based dual address derivation (eth_secp256k1)
- **Modern UI**: Vue 3 frontend with Keplr and MetaMask/WalletConnect integration
- **Transaction History**: Persistent tracking with explorer links
- **Production Ready**: Docker support, Vercel/Fly.io compatible

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## Quick Start

### 1. Install Dependencies
```bash
git clone <repository-url>
cd devnet-faucet
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your mnemonic:
```bash
# Required: 12-word mnemonic for wallet derivation
MNEMONIC="your twelve word mnemonic phrase here"
```

### 3. Configure Network

Edit `config.js` to set your network endpoints, chain IDs, and native token configuration:

```javascript
const config = {
  blockchain: {
    name: 'your-chain',
    ids: {
      chainId: 1234,              // EVM chain ID
      cosmosChainId: 'chain-1',   // Cosmos chain ID
    },
    endpoints: {
      rpc_endpoint: 'https://rpc.yourchain.com:26657',
      evm_endpoint: 'https://rpc.yourchain.com:8545',
      // ... other endpoints
    },
    sender: {
      option: {
        prefix: 'yourprefix',     // Bech32 address prefix
      },
    },
    tx: {
      amounts: [{
        denom: 'utoken',
        symbol: 'TOKEN',
        name: 'Your Token',
        amount: '1000000000000000000',
        decimals: 18,
      }],
    },
  },
};
```

### 4. Start the Server

```bash
npm start         # Start faucet server on port 8088
```

**Development mode with hot reload:**
```bash
npm run dev       # Start Vite dev server on port 3000
```

## Architecture

### Backend (Node.js + Express)

**Core Components:**
- `faucet.js` - Express server with API endpoints
- `config.js` - Network configuration and native token settings
- `checker.js` - Rate limiting system (address + IP)
- `src/SecureKeyManager.js` - Key derivation and address management

**Rate Limiting:**
- Per-address: 1 request per 24 hours
- Per-IP: 10 requests per 24 hours
- Persistent storage in `.faucet/history.db`

### Frontend (Vue 3 + Vite)

**Structure:**
- `src/main.js` - Vue app initialization
- `src/App.vue` - Root component with wallet integration
- `src/components/` - Vue components (Header, Tabs, Modals, etc.)
- `src/composables/` - Vue composables for state management

**Wallet Support:**
- Cosmos: Keplr wallet (desktop + mobile)
- EVM: MetaMask, WalletConnect, Reown AppKit

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Vue.js web interface |
| GET | `/health` | Health check endpoint |
| GET | `/send/:address` | Request tokens (Bech32 or EVM address) |
| GET | `/config.json` | Network configuration for frontend |
| GET | `/balance/cosmos` | Faucet Cosmos token balance |
| GET | `/balance/evm` | Faucet EVM token balance |

### Address Format Support

- **Cosmos/Bech32**: `{prefix}1...` (e.g., `republic1...`, `cosmos1...`)
- **EVM**: `0x...` (hex, 42 chars)

Both formats derived from same mnemonic using eth_secp256k1.

## Development

### Available Scripts

**Server:**
```bash
npm start              # Start production server
npm run dev            # Start Vite dev server with HMR
```

**Building:**
```bash
npm run build          # Build frontend for production
npm run preview        # Preview production build
```

**Testing & Linting:**
```bash
npm test               # Run all tests (Vitest)
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Generate coverage report
npm run lint           # Check code with Biome
npm run lint:fix       # Auto-fix linting issues
npm run check          # Run linting + tests
```

**Docker:**
```bash
npm run docker:build   # Build Docker image
npm run docker         # Run Docker container
```

### Project Structure

```
devnet-faucet/
|-- faucet.js                    # Main Express server
|-- config.js                    # Network configuration
|-- checker.js                   # Rate limiting system
|-- biome.json                   # Biome configuration
|-- vitest.config.js             # Vitest configuration
|-- vite.config.js               # Vite build configuration
|
|-- src/                         # Source files
|   |-- main.js                  # Vue app entry
|   |-- App.vue                  # Root Vue component
|   |-- SecureKeyManager.js      # Key management
|   |-- logRotation.js           # Log management
|   |
|   |-- components/              # Vue components
|   |   |-- Header.vue
|   |   |-- FaucetBalances.vue
|   |   |-- TransactionModal.vue
|   |   |-- tabs/
|   |       |-- FaucetTab.vue
|   |       |-- NetworkInfo.vue
|   |       |-- RecentTransactionsTab.vue
|   |
|   |-- composables/             # Vue composables
|   |   |-- useConfig.js
|   |   |-- useWalletStore.js
|   |   |-- useTransactions.js
|   |
|   |-- assets/                  # CSS and assets
|
|-- scripts/                     # Utility scripts
|   |-- deploy-to-fly.sh
|   |-- docker-run.sh
|   |-- query-ibc-denoms.js
|
|-- tests/                       # Test suite
    |-- SecureKeyManager.test.js
    |-- checker.test.js
    |-- config.test.js
    |-- faucet.test.js
```

## Deployment

### Environment Variables

**Required:**
- `MNEMONIC` - 12-word mnemonic phrase

**Optional:**
- `PORT` - Server port (default: 8088)
- `VITE_REOWN_PROJECT_ID` - WalletConnect project ID

### Production Deployment

#### Vercel
```bash
npm i -g vercel
vercel
vercel env add MNEMONIC
```

#### Fly.io
```bash
curl -L https://fly.io/install.sh | sh
fly deploy
```

#### Docker
```bash
npm run docker:build
docker run -p 8088:8088 -e MNEMONIC="..." devnet-faucet
```

## Monitoring

### Health Checks

```bash
# Check faucet balance
curl http://localhost:8088/balance/evm
curl http://localhost:8088/balance/cosmos

# Test API endpoint
curl http://localhost:8088/config.json

# Health check
curl http://localhost:8088/health
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint:fix`
6. Submit a pull request
