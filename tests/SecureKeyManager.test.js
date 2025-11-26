import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('SecureKeyManager', () => {
  let SecureKeyManager;
  let keyManager;
  const originalMnemonic = process.env.MNEMONIC;

  beforeEach(async () => {
    // Reset the module to get a fresh instance
    vi.resetModules();

    // Set test mnemonic
    process.env.MNEMONIC = 'test test test test test test test test test test test junk';

    // Import fresh module
    const module = await import('../src/SecureKeyManager.js');
    SecureKeyManager = module.default;
    keyManager = SecureKeyManager;

    // Clear any previous initialization
    keyManager._initialized = false;
    keyManager._keys.clear();
    keyManager._addressCache = null;
  });

  afterEach(() => {
    // Restore original mnemonic
    process.env.MNEMONIC = originalMnemonic;
    keyManager.clearSensitiveData();
  });

  describe('initialize', () => {
    it('should initialize successfully with valid mnemonic', async () => {
      await keyManager.initialize();
      expect(keyManager._initialized).toBe(true);
      expect(keyManager._addressCache).toBeDefined();
      expect(keyManager._addressCache.evm).toBeDefined();
      expect(keyManager._addressCache.cosmos).toBeDefined();
    });

    it('should throw error if MNEMONIC is not set', async () => {
      delete process.env.MNEMONIC;
      await expect(keyManager.initialize()).rejects.toThrow(
        'MNEMONIC environment variable not set'
      );
    });

    it('should throw error if mnemonic is invalid', async () => {
      process.env.MNEMONIC = 'invalid mnemonic phrase';
      await expect(keyManager.initialize()).rejects.toThrow('Invalid mnemonic phrase provided');
    });

    it('should not reinitialize if already initialized', async () => {
      await keyManager.initialize();
      const firstAddresses = keyManager.getAddresses();

      await keyManager.initialize();
      const secondAddresses = keyManager.getAddresses();

      expect(firstAddresses).toEqual(secondAddresses);
    });

    it('should derive correct EVM address format', async () => {
      await keyManager.initialize();
      const evmAddress = keyManager.getEvmAddress();

      expect(evmAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it('should derive correct Cosmos address format', async () => {
      await keyManager.initialize();
      const cosmosAddress = keyManager.getCosmosAddress();

      expect(cosmosAddress).toMatch(/^republic1[a-z0-9]{38}$/);
    });

    it('should have consistent addresses for same mnemonic', async () => {
      await keyManager.initialize();
      const addresses1 = keyManager.getAddresses();

      keyManager._initialized = false;
      keyManager._keys.clear();
      keyManager._addressCache = null;

      await keyManager.initialize();
      const addresses2 = keyManager.getAddresses();

      expect(addresses1.evm.address).toBe(addresses2.evm.address);
      expect(addresses1.cosmos.address).toBe(addresses2.cosmos.address);
    });
  });

  describe('getPrivateKeyHex', () => {
    it('should return private key in hex format', async () => {
      await keyManager.initialize();
      const privateKey = keyManager.getPrivateKeyHex();

      expect(privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
    });

    it('should throw error if not initialized', () => {
      expect(() => keyManager.getPrivateKeyHex()).toThrow('SecureKeyManager not initialized');
    });
  });

  describe('getPrivateKeyBytes', () => {
    it('should return private key as Uint8Array', async () => {
      await keyManager.initialize();
      const privateKey = keyManager.getPrivateKeyBytes();

      expect(privateKey).toBeInstanceOf(Uint8Array);
      expect(privateKey.length).toBe(32);
    });

    it('should throw error if not initialized', () => {
      expect(() => keyManager.getPrivateKeyBytes()).toThrow('SecureKeyManager not initialized');
    });
  });

  describe('getPublicKeyBytes', () => {
    it('should return compressed public key', async () => {
      await keyManager.initialize();
      const publicKey = keyManager.getPublicKeyBytes();

      expect(publicKey).toBeInstanceOf(Uint8Array);
      expect(publicKey.length).toBe(33); // Compressed public key
    });

    it('should throw error if not initialized', () => {
      expect(() => keyManager.getPublicKeyBytes()).toThrow('SecureKeyManager not initialized');
    });
  });

  describe('getAddresses', () => {
    it('should return both EVM and Cosmos addresses', async () => {
      await keyManager.initialize();
      const addresses = keyManager.getAddresses();

      expect(addresses).toHaveProperty('evm');
      expect(addresses).toHaveProperty('cosmos');
      expect(addresses.evm).toHaveProperty('address');
      expect(addresses.evm).toHaveProperty('publicKey');
      expect(addresses.cosmos).toHaveProperty('address');
      expect(addresses.cosmos).toHaveProperty('publicKey');
    });
  });

  describe('getEvmAddress', () => {
    it('should return EVM address', async () => {
      await keyManager.initialize();
      const address = keyManager.getEvmAddress();

      expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });
  });

  describe('getCosmosAddress', () => {
    it('should return Cosmos address', async () => {
      await keyManager.initialize();
      const address = keyManager.getCosmosAddress();

      expect(address).toMatch(/^republic1[a-z0-9]{38}$/);
    });
  });

  describe('getEvmPublicKey', () => {
    it('should return EVM public key in hex format', async () => {
      await keyManager.initialize();
      const publicKey = keyManager.getEvmPublicKey();

      expect(publicKey).toMatch(/^0x[0-9a-fA-F]{66}$/); // Compressed: 33 bytes = 66 hex chars
    });
  });

  describe('validateAddresses', () => {
    it('should validate matching addresses successfully', async () => {
      await keyManager.initialize();
      const addresses = keyManager.getAddresses();

      const result = keyManager.validateAddresses({
        evm: addresses.evm.address,
        cosmos: addresses.cosmos.address,
      });

      expect(result).toBe(true);
    });

    it('should throw error for mismatched EVM address', async () => {
      await keyManager.initialize();

      expect(() =>
        keyManager.validateAddresses({
          evm: '0x0000000000000000000000000000000000000000',
          cosmos: keyManager.getCosmosAddress(),
        })
      ).toThrow('Address validation failed');
    });

    it('should throw error for mismatched Cosmos address', async () => {
      await keyManager.initialize();

      expect(() =>
        keyManager.validateAddresses({
          evm: keyManager.getEvmAddress(),
          cosmos: 'cosmos1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqnrql8a',
        })
      ).toThrow('Address validation failed');
    });

    it('should handle nested address structure', async () => {
      await keyManager.initialize();
      const addresses = keyManager.getAddresses();

      const result = keyManager.validateAddresses({
        evm: { address: addresses.evm.address },
        cosmos: { address: addresses.cosmos.address },
      });

      expect(result).toBe(true);
    });
  });

  describe('clearSensitiveData', () => {
    it('should clear all sensitive data', async () => {
      await keyManager.initialize();
      expect(keyManager._initialized).toBe(true);

      keyManager.clearSensitiveData();

      expect(keyManager._initialized).toBe(false);
      expect(keyManager._keys.size).toBe(0);
    });

    it('should zero out private key before clearing', async () => {
      await keyManager.initialize();
      const privateKey = keyManager.getPrivateKeyBytes();

      // Store reference to check if it's zeroed
      const privateKeyCopy = new Uint8Array(privateKey);

      keyManager.clearSensitiveData();

      // The original buffer should be zeroed
      const isZeroed = Array.from(privateKey).every((byte) => byte === 0);
      expect(isZeroed).toBe(true);

      // But our copy should still have the original values
      expect(privateKeyCopy).not.toEqual(privateKey);
    });
  });

  describe('_ensureInitialized', () => {
    it('should not throw if initialized', async () => {
      await keyManager.initialize();
      expect(() => keyManager._ensureInitialized()).not.toThrow();
    });

    it('should throw if not initialized', () => {
      expect(() => keyManager._ensureInitialized()).toThrow('SecureKeyManager not initialized');
    });
  });

  describe('address derivation consistency', () => {
    it('should derive same addresses from same mnemonic across multiple instances', async () => {
      const mnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      process.env.MNEMONIC = mnemonic;

      // Reset and initialize first instance
      vi.resetModules();
      const module1 = await import('../src/SecureKeyManager.js');
      const km1 = module1.default;
      km1._initialized = false;
      km1._keys.clear();
      await km1.initialize();
      const addresses1 = km1.getAddresses();

      // Reset and initialize second instance
      vi.resetModules();
      const module2 = await import('../src/SecureKeyManager.js');
      const km2 = module2.default;
      km2._initialized = false;
      km2._keys.clear();
      await km2.initialize();
      const addresses2 = km2.getAddresses();

      expect(addresses1.evm.address).toBe(addresses2.evm.address);
      expect(addresses1.cosmos.address).toBe(addresses2.cosmos.address);

      km1.clearSensitiveData();
      km2.clearSensitiveData();
    });
  });
});
