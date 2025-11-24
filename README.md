# Cosmos EVM Devnet Faucet

A dual-chain faucet system for distributing both Cosmos native tokens (ATOM) and ERC-20 tokens on Cosmos EVM environments. Built for frequently-resetting devnets with automated contract deployment and comprehensive rate limiting.

## Features

- **Dual Environment Support**: Simultaneous Cosmos SDK + EVM compatibility
- **Multi-Token Distribution**: ATOM, WBTC, PEPE, USDT and configurable ERC-20 tokens
- **Intelligent Rate Limiting**: Per-address (1/24h) and per-IP (10/24h) with SQLite persistence
- **Token Allowance Tracking**: Daily limits per token (10x single request amount)
- **Secure Key Management**: Mnemonic-based dual address derivation (eth_secp256k1)
- **Automated Deployment**: One-command contract deployment and validation
- **Modern UI**: Vue 3 frontend with Keplr and MetaMask/WalletConnect integration
- **Transaction History**: Persistent tracking with explorer links
- **Production Ready**: Docker support, Vercel/Fly.io compatible

## Prerequisites

**Required:**
- Node.js >= 18.0.0
- npm or yarn

**Optional (for smart contract development):**
- Foundry (for Solidity compilation and testing)

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

# Optional: Custom RPC endpoints (defaults configured in config.js)
# RPC_ENDPOINT="https://custom-rpc.example.com"
# EVM_RPC_ENDPOINT="https://custom-evm-rpc.example.com"
```

### 3. Deploy Contracts & Start Server

**For new deployments:**
```bash
npm run deploy    # Deploy contracts and configure system
npm start         # Start faucet server on port 8088
```

**For existing deployments:**
```bash
npm start         # Just start the server
```

**Development mode with hot reload:**
```bash
npm run dev       # Start Vite dev server on port 3000
```

## Configuration

### Network Configuration (`config.js`)

Primary configuration for blockchain connectivity:

```javascript
blockchain: {
  name: "cosmos-evm-chain",
  type: "DualEnvironment",
  ids: {
    chainId: 4231,           // EVM chain ID
    cosmosChainId: '4321',   // Cosmos chain ID
  },
  endpoints: {
    rpc_endpoint: "https://devnet-1-rpc.ib.skip.build",
    grpc_endpoint: "devnet-1-grpc.ib.skip.build:443",
    rest_endpoint: "https://devnet-1-lcd.ib.skip.build",
    evm_endpoint: "https://devnet-1-evmrpc.ib.skip.build",
    evm_websocket: "wss://devnet-1-evmws.ib.skip.build",
    evm_explorer: "https://evm-devnet-1.cloud.blockscout.com",
    cosmos_explorer: "https://devnet-explorer.fly.dev/...",
  }
}
```

### Token Configuration (`tokens.json`)

Comprehensive token metadata including:
- Contract addresses and deployment configuration
- Faucet distribution amounts and daily limits
- Token features (mintable, burnable, pausable)
- Governance roles and permissions
- UI metadata (logos, descriptions, categories)

Example token entry:
```json
{
  "symbol": "WBTC",
  "name": "Wrapped Bitcoin",
  "decimals": 8,
  "contract": {
    "address": "0xB259846bb...",
    "deployer": "0x..."
  },
  "faucet": {
    "enabled": true,
    "configuration": {
      "amountPerRequest": "100000000",
      "targetBalance": "1000000000000"
    }
  }
}
```

## Architecture

### Backend (Node.js + Express)

**Core Components:**
- `faucet.js` - Express server with API endpoints
- `config.js` - Network configuration and settings
- `checker.js` - Rate limiting system (address + IP)
- `tokenAllowance.js` - Daily token allowance tracking
- `src/SecureKeyManager.js` - Key derivation and address management
- `src/TokenConfigLoader.js` - Configuration loader and validator
- `src/ContractValidator.js` - Contract validation on startup

**Rate Limiting:**
- Per-address: 1 request per 24 hours
- Per-IP: 10 requests per 24 hours
- Per-token daily allowance: 10x single request amount
- Persistent storage in `.faucet/history.db` and `.faucet/allowances.db`

### Frontend (Vue 3 + Vite)

**Structure:**
- `src/main.js` - Vue app initialization
- `src/App.vue` - Root component with wallet integration
- `src/components/` - Vue components (Header, Tabs, Modals, etc.)
- `src/composables/` - Vue composables for state management
- `index.html` - Entry point

**Wallet Support:**
- Cosmos: Keplr wallet (desktop + mobile)
- EVM: MetaMask, WalletConnect, Reown AppKit

### Smart Contracts (Solidity)

- `src/AtomicMultiSend.sol` - Batch ERC-20 distribution contract
- `src/tokens/*.sol` - ERC-20 token implementations (WBTC, PEPE, USDT)
- `src/preinstalled/` - Standard contracts (Multicall3, Create2, etc.)

Compiled with Foundry, deployed automatically via deployment scripts.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Vue.js web interface |
| GET | `/send/:address` | Request tokens (Cosmos or EVM address) |
| GET | `/config.json` | Network configuration for frontend |
| GET | `/balance/cosmos` | Faucet Cosmos token balances |
| GET | `/balance/evm` | Faucet EVM token balances |
| POST | `/transaction/:txHash` | Get transaction details |

### Address Format Support

- **Cosmos**: `cosmos1...` (bech32, 39 chars)
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
npm run test:ui        # Run tests with UI
npm run test:coverage  # Generate coverage report
npm run lint           # Check code with Biome
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format code with Biome
npm run check          # Run linting + tests
```

**Deployment:**
```bash
npm run deploy         # Deploy contracts and configure
npm run deploy:test    # Deploy with test mode
npm run validate       # Validate environment
npm run approval       # Setup token approvals
```

**Smart Contracts (requires Foundry):**
```bash
npm run test:solidity  # Run Solidity tests (forge test)
forge build            # Compile contracts
forge test             # Test contracts
```

**Docker:**
```bash
npm run docker:build   # Build Docker image
npm run docker         # Run Docker container
```

### Testing

Comprehensive test suite with 154 tests covering:
- SecureKeyManager (key derivation, address generation)
- TokenConfigLoader (configuration loading and validation)
- FrequencyChecker (rate limiting logic)
- TokenAllowanceTracker (daily allowance limits)
- Config (network configuration)
- Application structure validation

Run tests with:
```bash
npm test                    # Run all tests
npm run test:coverage       # Generate coverage report
```

### Linting

Code quality enforced with Biome:
- Consistent code formatting
- Import organization
- Node.js best practices
- ES2022+ standards

### Project Structure

```
devnet-faucet/
├── faucet.js                    # Main Express server
├── config.js                    # Network configuration
├── checker.js                   # Rate limiting system
├── tokenAllowance.js            # Token allowance tracking
├── tokens.json                  # Token definitions
├── biome.json                   # Biome configuration
├── vitest.config.js             # Vitest configuration
├── vite.config.js               # Vite build configuration
├── foundry.toml                 # Foundry config (optional)
│
├── src/                         # Source files
│   ├── main.js                  # Vue app entry
│   ├── App.vue                  # Root Vue component
│   ├── SecureKeyManager.js      # Key management
│   ├── TokenConfigLoader.js     # Config loader
│   ├── ContractValidator.js     # Contract validation
│   ├── logRotation.js           # Log management
│   │
│   ├── components/              # Vue components
│   │   ├── Header.vue
│   │   ├── FaucetBalances.vue
│   │   ├── TransactionModal.vue
│   │   └── tabs/
│   │       ├── FaucetTab.vue
│   │       ├── NetworkInfo.vue
│   │       └── RecentTransactionsTab.vue
│   │
│   ├── composables/             # Vue composables
│   │   ├── useConfig.js
│   │   ├── useWalletStore.js
│   │   └── useTransactions.js
│   │
│   ├── tokens/                  # Token contracts
│   │   ├── WBTC.sol
│   │   ├── PEPE.sol
│   │   └── USDT.sol
│   │
│   ├── AtomicMultiSend.sol      # Batch transfer contract
│   └── preinstalled/            # Standard contracts
│
├── scripts/                     # Deployment scripts
│   ├── automated-deploy.js      # Full deployment pipeline
│   ├── setup-approvals.js       # Token approvals
│   ├── mint-tokens-to-faucet.js # Token minting
│   └── query-ibc-denoms.js      # IBC queries
│
├── tests/                       # Test suite
│   ├── SecureKeyManager.test.js
│   ├── TokenConfigLoader.test.js
│   ├── checker.test.js
│   ├── tokenAllowance.test.js
│   ├── config.test.js
│   └── faucet.test.js
│
└── lib/                         # External libraries
    ├── forge-std/               # Foundry std lib
    └── openzeppelin-contracts/  # OpenZeppelin
```

## Deployment

### Automated Deployment

The `automated-deploy.js` script handles complete deployment:

```bash
npm run deploy
```

This will:
1. ✅ Validate environment variables and dependencies
2. 🔨 Compile Solidity contracts (requires Foundry)
3. 🚀 Deploy ERC-20 tokens from `tokens.json`
4. 🚀 Deploy AtomicMultiSend batch transfer contract
5. ✅ Set token approvals for faucet wallet
6. ✅ Verify all contracts are accessible
7. 📝 Update `tokens.json` with deployed addresses

### Manual Deployment Steps

If you need more control:

```bash
# 1. Validate environment
npm run validate

# 2. Compile contracts (requires Foundry)
forge build

# 3. Deploy and configure
node scripts/automated-deploy.js

# 4. Setup approvals
npm run approval

# 5. Verify contracts
node scripts/validate-contracts.js
```

### Production Deployment

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable
vercel env add MNEMONIC
```

#### Fly.io
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
fly deploy
```

#### Docker
```bash
# Build image
npm run docker:build

# Run container
docker run -p 8088:8088 -e MNEMONIC="..." devnet-faucet
```

### Environment Variables

**Required:**
- `MNEMONIC` - 12-word mnemonic phrase

**Optional:**
- `RPC_ENDPOINT` - Custom Cosmos RPC endpoint
- `EVM_RPC_ENDPOINT` - Custom EVM RPC endpoint
- `PORT` - Server port (default: 8088)
- `VITE_REOWN_PROJECT_ID` - WalletConnect project ID

## Monitoring & Maintenance

### Health Checks

```bash
# Check faucet balances
curl http://localhost:8088/balance/evm
curl http://localhost:8088/balance/cosmos

# Validate environment
npm run validate

# Test API endpoint
curl http://localhost:8088/config.json
```

### Devnet Reset Recovery

When the devnet resets:

1. **Update configuration** (if chain IDs or endpoints changed)
   ```bash
   # Edit config.js with new chain IDs/endpoints
   vim config.js
   ```

2. **Redeploy contracts**
   ```bash
   npm run deploy
   ```

3. **Restart server**
   ```bash
   npm start
   ```

### Monitoring Checklist

- ✅ Faucet wallet has sufficient native tokens for gas
- ✅ Faucet wallet has ERC-20 tokens for distribution
- ✅ RPC endpoints are accessible
- ✅ Contracts are deployed and validated
- ✅ Rate limiting database is not corrupted

## Troubleshooting

### Common Issues

**"MNEMONIC environment variable not set"**
```bash
# Create .env file
cp .env.example .env
# Add your mnemonic to .env
echo 'MNEMONIC="your twelve words here"' >> .env
```

**"Contract validation failed"**
```bash
# Redeploy contracts
npm run deploy
```

**"Address derivation mismatch"**
- Verify mnemonic is correct in `.env`
- Ensure no extra spaces or quotes in mnemonic
- Check that derivation path is `m/44'/60'/0'/0/0`

**Build fails with viem errors**
```bash
# Update dependencies
npm install viem@latest
```

**Frontend not loading**
```bash
# Rebuild frontend
npm run build
# Or start dev server
npm run dev
```

**Rate limit database errors**
```bash
# Remove corrupted database
rm -rf .faucet/*.db
# Restart server
npm start
```

### Logs

- Server logs: Console output
- Transaction history: Browser localStorage
- Rate limiting: `.faucet/history.db`
- Token allowances: `.faucet/allowances.db`

## Adding New Tokens

1. **Edit `tokens.json`** - Add token configuration:
```json
{
  "symbol": "NEWTOKEN",
  "name": "New Token",
  "decimals": 18,
  "contract": {
    "address": "",
    "deployer": ""
  },
  "faucet": {
    "enabled": true,
    "configuration": {
      "amountPerRequest": "1000000000000000000",
      "targetBalance": "100000000000000000000"
    }
  },
  "features": {
    "mintable": true,
    "burnable": true,
    "pausable": false
  }
}
```

2. **Redeploy contracts**:
```bash
npm run deploy
```

3. **Restart faucet**:
```bash
npm start
```

## License

MIT

## Support

For issues, please check:
1. This README for troubleshooting
2. GitHub Issues for known problems
3. Configuration files for correct setup

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint:fix`
6. Submit a pull request
