import { beforeAll, describe, expect, it } from 'vitest';

describe('config', () => {
  let config;
  let initializeSecureKeys;
  let getEvmAddress;
  let getCosmosAddress;
  let getPrivateKey;
  let getPrivateKeyBytes;
  let getPublicKeyBytes;
  let getEvmPublicKey;
  let validateDerivedAddresses;

  beforeAll(async () => {
    // Import config module
    const configModule = await import('../config.js');
    config = configModule.default;
    initializeSecureKeys = configModule.initializeSecureKeys;
    getEvmAddress = configModule.getEvmAddress;
    getCosmosAddress = configModule.getCosmosAddress;
    getPrivateKey = configModule.getPrivateKey;
    getPrivateKeyBytes = configModule.getPrivateKeyBytes;
    getPublicKeyBytes = configModule.getPublicKeyBytes;
    getEvmPublicKey = configModule.getEvmPublicKey;
    validateDerivedAddresses = configModule.validateDerivedAddresses;
  });

  describe('configuration structure', () => {
    it('should have required top-level properties', () => {
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('db');
      expect(config).toHaveProperty('project');
      expect(config).toHaveProperty('blockchain');
    });

    it('should have correct port configuration', () => {
      expect(typeof config.port).toBe('number');
      expect(config.port).toBeGreaterThan(0);
    });

    it('should have database configuration', () => {
      expect(config.db).toHaveProperty('path');
      expect(typeof config.db.path).toBe('string');
    });

    it('should have project metadata', () => {
      expect(config.project).toHaveProperty('name');
      expect(config.project).toHaveProperty('logo');
      expect(config.project).toHaveProperty('deployer');
    });
  });

  describe('blockchain configuration', () => {
    it('should have blockchain name and type', () => {
      expect(config.blockchain).toHaveProperty('name');
      expect(config.blockchain).toHaveProperty('type');
      expect(config.blockchain.type).toBe('DualEnvironment');
    });

    it('should have chain IDs', () => {
      expect(config.blockchain.ids).toHaveProperty('chainId');
      expect(config.blockchain.ids).toHaveProperty('cosmosChainId');
      expect(typeof config.blockchain.ids.chainId).toBe('number');
      expect(typeof config.blockchain.ids.cosmosChainId).toBe('string');
    });

    it('should have endpoints configured', () => {
      const endpoints = config.blockchain.endpoints;

      expect(endpoints).toHaveProperty('rpc_endpoint');
      expect(endpoints).toHaveProperty('grpc_endpoint');
      expect(endpoints).toHaveProperty('rest_endpoint');
      expect(endpoints).toHaveProperty('evm_endpoint');
      expect(endpoints).toHaveProperty('evm_websocket');
      expect(endpoints).toHaveProperty('evm_explorer');
      expect(endpoints).toHaveProperty('cosmos_explorer');

      // Check that endpoints are valid URLs or addresses
      expect(endpoints.rpc_endpoint).toMatch(/^https?:\/\//);
      expect(endpoints.evm_endpoint).toMatch(/^https?:\/\//);
    });

    it('should have contracts configuration', () => {
      expect(config.blockchain).toHaveProperty('contracts');
      expect(config.blockchain.contracts).toHaveProperty('atomicMultiSend');
    });

    it('should have sender options', () => {
      expect(config.blockchain.sender).toHaveProperty('option');
      expect(config.blockchain.sender.option).toHaveProperty('hdPaths');
      expect(config.blockchain.sender.option).toHaveProperty('prefix');
      expect(config.blockchain.sender.option.prefix).toBe('cosmos');
    });
  });

  describe('transaction configuration', () => {
    it('should have token amounts loaded from TokenConfigLoader', () => {
      expect(config.blockchain.tx).toHaveProperty('amounts');
      expect(Array.isArray(config.blockchain.tx.amounts)).toBe(true);

      // Should have tokens loaded
      if (config.blockchain.tx.amounts.length > 0) {
        const token = config.blockchain.tx.amounts[0];
        expect(token).toHaveProperty('denom');
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('amount');
        expect(token).toHaveProperty('erc20_contract');
        expect(token).toHaveProperty('decimals');
      }
    });

    it('should have fee configuration for both Cosmos and EVM', () => {
      expect(config.blockchain.tx).toHaveProperty('fee');
      expect(config.blockchain.tx.fee).toHaveProperty('cosmos');
      expect(config.blockchain.tx.fee).toHaveProperty('evm');

      // Cosmos fee
      const cosmosFee = config.blockchain.tx.fee.cosmos;
      expect(cosmosFee).toHaveProperty('amount');
      expect(cosmosFee).toHaveProperty('gas');
      expect(Array.isArray(cosmosFee.amount)).toBe(true);

      // EVM fee
      const evmFee = config.blockchain.tx.fee.evm;
      expect(evmFee).toHaveProperty('gasLimit');
      expect(evmFee).toHaveProperty('gasPrice');
    });
  });

  describe('rate limits', () => {
    it('should have rate limit configuration', () => {
      expect(config.blockchain.limit).toHaveProperty('address');
      expect(config.blockchain.limit).toHaveProperty('ip');
      expect(typeof config.blockchain.limit.address).toBe('number');
      expect(typeof config.blockchain.limit.ip).toBe('number');
    });

    it('should have reasonable rate limits', () => {
      expect(config.blockchain.limit.address).toBeGreaterThan(0);
      expect(config.blockchain.limit.ip).toBeGreaterThan(0);
      expect(config.blockchain.limit.ip).toBeGreaterThanOrEqual(config.blockchain.limit.address);
    });
  });

  describe('secure key management integration', () => {
    it('should initialize secure keys', async () => {
      await initializeSecureKeys();
      expect(config).toHaveProperty('derivedAddresses');
    });

    it('should provide EVM address getter', async () => {
      await initializeSecureKeys();
      const evmAddress = getEvmAddress();

      expect(evmAddress).toBeDefined();
      expect(evmAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it('should provide Cosmos address getter', async () => {
      await initializeSecureKeys();
      const cosmosAddress = getCosmosAddress();

      expect(cosmosAddress).toBeDefined();
      expect(cosmosAddress).toMatch(/^cosmos1[a-z0-9]{38}$/);
    });

    it('should provide private key in hex format', async () => {
      await initializeSecureKeys();
      const privateKey = getPrivateKey();

      expect(privateKey).toBeDefined();
      expect(privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
    });

    it('should provide private key bytes', async () => {
      await initializeSecureKeys();
      const privateKeyBytes = getPrivateKeyBytes();

      expect(privateKeyBytes).toBeInstanceOf(Uint8Array);
      expect(privateKeyBytes.length).toBe(32);
    });

    it('should provide public key bytes', async () => {
      await initializeSecureKeys();
      const publicKeyBytes = getPublicKeyBytes();

      expect(publicKeyBytes).toBeInstanceOf(Uint8Array);
      expect(publicKeyBytes.length).toBe(33); // Compressed
    });

    it('should provide EVM public key', async () => {
      await initializeSecureKeys();
      const publicKey = getEvmPublicKey();

      expect(publicKey).toBeDefined();
      expect(publicKey).toMatch(/^0x[0-9a-fA-F]{66}$/);
    });

    it('should validate derived addresses', async () => {
      await initializeSecureKeys();
      const evmAddress = getEvmAddress();
      const cosmosAddress = getCosmosAddress();

      const isValid = validateDerivedAddresses({
        evm: evmAddress,
        cosmos: cosmosAddress,
      });

      expect(isValid).toBe(true);
    });

    it('should have derivedAddresses cached in config after initialization', async () => {
      await initializeSecureKeys();

      expect(config.derivedAddresses).toBeDefined();
      expect(config.derivedAddresses).toHaveProperty('evm');
      expect(config.derivedAddresses).toHaveProperty('cosmos');
      expect(config.derivedAddresses.evm).toHaveProperty('address');
      expect(config.derivedAddresses.evm).toHaveProperty('publicKey');
      expect(config.derivedAddresses.cosmos).toHaveProperty('address');
      expect(config.derivedAddresses.cosmos).toHaveProperty('publicKey');
    });
  });

  describe('deprecated exports', () => {
    it('should have deprecated exports as null', async () => {
      const configModule = await import('../config.js');

      expect(configModule.DERIVED_ADDRESS).toBeNull();
      expect(configModule.DERIVED_PUBLIC_KEY).toBeNull();
      expect(configModule.DERIVED_COSMOS_ADDRESS).toBeNull();
    });
  });

  describe('TokenConfigLoader integration', () => {
    it('should load atomicMultiSend contract address from tokens.json', () => {
      expect(config.blockchain.contracts.atomicMultiSend).toBeDefined();

      // If atomicMultiSend is set, it should be a valid address
      if (config.blockchain.contracts.atomicMultiSend) {
        expect(config.blockchain.contracts.atomicMultiSend).toMatch(/^0x[0-9a-fA-F]{40}$/);
      }
    });

    it('should have tokens with proper structure', () => {
      const amounts = config.blockchain.tx.amounts;

      amounts.forEach((token) => {
        expect(token).toHaveProperty('denom');
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('amount');
        expect(token).toHaveProperty('decimals');
        expect(token).toHaveProperty('erc20_contract');
        expect(token).toHaveProperty('target_balance');

        // Validate data types
        expect(typeof token.denom).toBe('string');
        expect(typeof token.symbol).toBe('string');
        expect(typeof token.name).toBe('string');
        expect(typeof token.amount).toBe('string');
        expect(typeof token.decimals).toBe('number');
        // erc20_contract can be string or object (for native tokens with wrappers)
        expect(['string', 'object'].includes(typeof token.erc20_contract)).toBe(true);
      });
    });
  });
});
