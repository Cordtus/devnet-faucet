import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TokenConfigLoader from '../src/TokenConfigLoader.js';

describe('TokenConfigLoader', () => {
  const testTokensPath = path.join(process.cwd(), 'tokens.json');
  let originalTokensData;
  let hasOriginalTokens = false;

  beforeEach(() => {
    // Backup original tokens.json if it exists
    if (fs.existsSync(testTokensPath)) {
      originalTokensData = fs.readFileSync(testTokensPath, 'utf8');
      hasOriginalTokens = true;
    }
  });

  afterEach(() => {
    // Restore original tokens.json
    if (hasOriginalTokens && originalTokensData) {
      fs.writeFileSync(testTokensPath, originalTokensData);
    }
  });

  describe('constructor and loadConfig', () => {
    it('should load tokens.json successfully', () => {
      if (!fs.existsSync(testTokensPath)) {
        // Create a minimal test config
        const testConfig = {
          meta: {
            network: { chainId: '9000', cosmosChainId: 'evmos_9000-1' },
            faucet: { contractAddress: '0x123', atomicMultiSend: '0x123', operator: '0x456' },
          },
          tokens: [],
          nativeTokens: [],
        };
        fs.writeFileSync(testTokensPath, JSON.stringify(testConfig));
      }

      const loader = new TokenConfigLoader();
      expect(loader.tokensConfig).toBeDefined();
      expect(loader.tokensConfig).toHaveProperty('tokens');
      expect(loader.tokensConfig).toHaveProperty('nativeTokens');
    });

    it('should throw error if tokens.json does not exist', () => {
      // Temporarily rename tokens.json
      if (fs.existsSync(testTokensPath)) {
        fs.renameSync(testTokensPath, testTokensPath + '.bak');
      }

      expect(() => new TokenConfigLoader()).toThrow('tokens.json not found');

      // Restore
      if (fs.existsSync(testTokensPath + '.bak')) {
        fs.renameSync(testTokensPath + '.bak', testTokensPath);
      }
    });

    it('should accept network config from external source', () => {
      const networkConfig = {
        rpc: 'http://localhost:26657',
        chainId: 'test-chain',
      };

      const loader = new TokenConfigLoader(networkConfig);
      expect(loader.networkConfig).toEqual(networkConfig);
    });
  });

  describe('getNetworkConfig', () => {
    it('should return external network config if provided', () => {
      const networkConfig = {
        rpc: 'http://localhost:26657',
        chainId: 'test-chain',
      };

      const loader = new TokenConfigLoader(networkConfig);
      expect(loader.getNetworkConfig()).toEqual(networkConfig);
    });

    it('should throw error if no network config provided', () => {
      const loader = new TokenConfigLoader();
      expect(() => loader.getNetworkConfig()).toThrow(
        'Network configuration must be provided from config.js'
      );
    });
  });

  describe('getFaucetConfig', () => {
    it('should return faucet configuration', () => {
      const loader = new TokenConfigLoader();
      const faucetConfig = loader.getFaucetConfig();

      expect(faucetConfig).toHaveProperty('contractAddress');
      expect(faucetConfig).toHaveProperty('atomicMultiSend');
      expect(faucetConfig).toHaveProperty('operator');
    });
  });

  describe('getErc20Tokens', () => {
    it('should return only enabled ERC20 tokens', () => {
      const loader = new TokenConfigLoader();
      const erc20Tokens = loader.getErc20Tokens();

      expect(Array.isArray(erc20Tokens)).toBe(true);
      erc20Tokens.forEach((token) => {
        expect(token).toHaveProperty('denom');
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('decimals');
        expect(token).toHaveProperty('erc20_contract');
        expect(token).toHaveProperty('amount');
      });
    });

    it('should filter out disabled tokens', () => {
      const loader = new TokenConfigLoader();
      const erc20Tokens = loader.getErc20Tokens();

      // All returned tokens should be enabled
      const allEnabled = erc20Tokens.every((token) => {
        const originalToken = loader.tokensConfig.tokens.find((t) => t.symbol === token.symbol);
        return originalToken?.faucet?.enabled === true;
      });

      expect(allEnabled).toBe(true);
    });
  });

  describe('getNativeTokens', () => {
    it('should return only enabled native tokens', () => {
      const loader = new TokenConfigLoader();
      const nativeTokens = loader.getNativeTokens();

      expect(Array.isArray(nativeTokens)).toBe(true);
      nativeTokens.forEach((token) => {
        expect(token).toHaveProperty('denom');
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('decimals');
        expect(token).toHaveProperty('amount');
      });
    });
  });

  describe('getAllTokensForConfig', () => {
    it('should return all enabled tokens in config.js format', () => {
      const loader = new TokenConfigLoader();
      const allTokens = loader.getAllTokensForConfig();

      expect(Array.isArray(allTokens)).toBe(true);
      allTokens.forEach((token) => {
        expect(token).toHaveProperty('denom');
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('amount');
        expect(token).toHaveProperty('erc20_contract');
        expect(token).toHaveProperty('decimals');
        expect(token).toHaveProperty('target_balance');
      });
    });
  });

  describe('getTokenBySymbol', () => {
    it('should find ERC20 token by symbol', () => {
      const loader = new TokenConfigLoader();
      const erc20Tokens = loader.getErc20Tokens();

      if (erc20Tokens.length > 0) {
        const firstToken = erc20Tokens[0];
        const foundToken = loader.getTokenBySymbol(firstToken.symbol);

        expect(foundToken).toBeDefined();
        expect(foundToken.symbol).toBe(firstToken.symbol);
      }
    });

    it('should find native token by symbol', () => {
      const loader = new TokenConfigLoader();
      const nativeTokens = loader.getNativeTokens();

      if (nativeTokens.length > 0) {
        const firstToken = nativeTokens[0];
        const foundToken = loader.getTokenBySymbol(firstToken.symbol);

        expect(foundToken).toBeDefined();
        expect(foundToken.symbol).toBe(firstToken.symbol);
      }
    });

    it('should be case-insensitive', () => {
      const loader = new TokenConfigLoader();
      const erc20Tokens = loader.getErc20Tokens();

      if (erc20Tokens.length > 0) {
        const firstToken = erc20Tokens[0];
        const foundUpper = loader.getTokenBySymbol(firstToken.symbol.toUpperCase());
        const foundLower = loader.getTokenBySymbol(firstToken.symbol.toLowerCase());

        expect(foundUpper).toBeDefined();
        expect(foundLower).toBeDefined();
      }
    });

    it('should return null for non-existent token', () => {
      const loader = new TokenConfigLoader();
      const token = loader.getTokenBySymbol('NONEXISTENT');

      expect(token).toBeNull();
    });
  });

  describe('updateTokenContractAddress', () => {
    it('should update token contract address', () => {
      const loader = new TokenConfigLoader();
      const erc20Tokens = loader.getErc20Tokens();

      if (erc20Tokens.length > 0) {
        const firstToken = erc20Tokens[0];
        const newAddress = '0x' + '1'.repeat(40);

        const result = loader.updateTokenContractAddress(firstToken.symbol, newAddress);
        expect(result).toBe(true);

        const updatedToken = loader.getTokenBySymbol(firstToken.symbol);
        expect(updatedToken.contract.address).toBe(newAddress);
      }
    });

    it('should return false for non-existent token', () => {
      const loader = new TokenConfigLoader();
      const result = loader.updateTokenContractAddress('NONEXISTENT', '0x123');

      expect(result).toBe(false);
    });
  });

  describe('updateFaucetAddresses', () => {
    it('should update faucet contract addresses', () => {
      const loader = new TokenConfigLoader();
      const atomicMultiSend = '0x' + '2'.repeat(40);
      const operator = '0x' + '3'.repeat(40);

      loader.updateFaucetAddresses(atomicMultiSend, operator);

      const faucetConfig = loader.getFaucetConfig();
      expect(faucetConfig.atomicMultiSend).toBe(atomicMultiSend);
      expect(faucetConfig.contractAddress).toBe(atomicMultiSend);
      expect(faucetConfig.operator).toBe(operator);
    });

    it('should update token governance roles when operator provided', () => {
      const loader = new TokenConfigLoader();
      const atomicMultiSend = '0x' + '2'.repeat(40);
      const operator = '0x' + '3'.repeat(40);

      loader.updateFaucetAddresses(atomicMultiSend, operator);

      // Check that tokens have updated governance addresses
      const tokens = loader.tokensConfig.tokens;
      if (tokens.length > 0) {
        const firstToken = tokens[0];
        expect(firstToken.governance.roles.owner.address).toBe(operator);
        expect(firstToken.governance.roles.minter.address).toBe(operator);
        expect(firstToken.governance.roles.pauser.address).toBe(operator);
      }
    });
  });

  describe('updateNetworkConfig', () => {
    it('should update network configuration', () => {
      const loader = new TokenConfigLoader();
      const chainId = '12345';
      const cosmosChainId = 'test_12345-1';
      const networkName = 'Test Network';

      loader.updateNetworkConfig(chainId, cosmosChainId, networkName);

      expect(loader.tokensConfig.meta.network.chainId).toBe(chainId);
      expect(loader.tokensConfig.meta.network.cosmosChainId).toBe(cosmosChainId);
      expect(loader.tokensConfig.meta.network.name).toBe(networkName);
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const loader = new TokenConfigLoader();
      const validation = loader.validateConfig();

      // Check that validation returns expected structure
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('issues');
      expect(Array.isArray(validation.issues)).toBe(true);
    });

    it('should detect missing required fields', () => {
      // Create invalid config
      const invalidConfig = {
        meta: { network: {}, faucet: {} },
        tokens: [
          {
            symbol: 'TEST',
            contract: {},
            faucet: {},
          },
        ],
        nativeTokens: [],
      };

      fs.writeFileSync(testTokensPath, JSON.stringify(invalidConfig));
      const loader = new TokenConfigLoader();
      const validation = loader.validateConfig();

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('generateSummary', () => {
    it('should generate configuration summary', () => {
      const networkConfig = {
        rpc: 'http://localhost:26657',
        chainId: 'test-chain',
      };

      const loader = new TokenConfigLoader(networkConfig);
      const summary = loader.generateSummary();

      expect(summary).toHaveProperty('network');
      expect(summary).toHaveProperty('faucet');
      expect(summary).toHaveProperty('tokens');
      expect(summary.tokens).toHaveProperty('erc20Count');
      expect(summary.tokens).toHaveProperty('nativeCount');
      expect(summary.tokens).toHaveProperty('erc20Tokens');
      expect(summary.tokens).toHaveProperty('nativeTokens');
    });
  });
});
