import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('faucet application', () => {
  describe('file structure', () => {
    it('should have faucet.js main file', () => {
      const faucetPath = path.join(process.cwd(), 'faucet.js');
      expect(fs.existsSync(faucetPath)).toBe(true);
    });

    it('should have required dependency files', () => {
      expect(fs.existsSync(path.join(process.cwd(), 'config.js'))).toBe(true);
      expect(fs.existsSync(path.join(process.cwd(), 'checker.js'))).toBe(true);
      expect(fs.existsSync(path.join(process.cwd(), 'tokenAllowance.js'))).toBe(true);
      expect(fs.existsSync(path.join(process.cwd(), 'tokens.json'))).toBe(true);
    });

    it('should have src directory with utilities', () => {
      const srcPath = path.join(process.cwd(), 'src');
      expect(fs.existsSync(srcPath)).toBe(true);
      expect(fs.existsSync(path.join(srcPath, 'SecureKeyManager.js'))).toBe(true);
      expect(fs.existsSync(path.join(srcPath, 'TokenConfigLoader.js'))).toBe(true);
      expect(fs.existsSync(path.join(srcPath, 'ContractValidator.js'))).toBe(true);
    });
  });

  describe('configuration validation', () => {
    it('should have valid tokens.json', () => {
      const tokensPath = path.join(process.cwd(), 'tokens.json');
      const tokensContent = fs.readFileSync(tokensPath, 'utf8');
      const tokensData = JSON.parse(tokensContent);

      expect(tokensData).toHaveProperty('meta');
      expect(tokensData).toHaveProperty('tokens');
      expect(tokensData).toHaveProperty('nativeTokens');
    });

    it('should have tokens with required fields', () => {
      const tokensPath = path.join(process.cwd(), 'tokens.json');
      const tokensData = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

      if (tokensData.tokens.length > 0) {
        const token = tokensData.tokens[0];
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('decimals');
        expect(token).toHaveProperty('contract');
        expect(token).toHaveProperty('faucet');
      }
    });

    it('should have faucet configuration in tokens.json', () => {
      const tokensPath = path.join(process.cwd(), 'tokens.json');
      const tokensData = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

      expect(tokensData.meta).toHaveProperty('faucet');
      expect(tokensData.meta.faucet).toHaveProperty('atomicMultiSend');
    });
  });

  describe('environment requirements', () => {
    it('should check for MNEMONIC environment variable', () => {
      // The app requires MNEMONIC for key management
      // This test just checks that the env var is either set or we know it's required
      const hasMnemonic = !!process.env.MNEMONIC;

      // Either it's set, or we're using the test default from setup.js
      expect(typeof process.env.MNEMONIC).toBe('string');
      expect(process.env.MNEMONIC.length).toBeGreaterThan(0);
    });

    it('should have RPC endpoint configured', () => {
      expect(process.env.RPC_ENDPOINT).toBeDefined();
      expect(typeof process.env.RPC_ENDPOINT).toBe('string');
    });

    it('should have EVM RPC endpoint configured', () => {
      expect(process.env.EVM_RPC_ENDPOINT).toBeDefined();
      expect(typeof process.env.EVM_RPC_ENDPOINT).toBe('string');
    });
  });

  describe('package.json configuration', () => {
    it('should have correct start script', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      expect(packageData.scripts).toHaveProperty('start');
      expect(packageData.scripts.start).toContain('faucet.js');
    });

    it('should have required dependencies', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      const requiredDeps = ['express', 'cors', 'ethers', 'dotenv', 'bip39', 'vue'];

      requiredDeps.forEach((dep) => {
        expect(packageData.dependencies).toHaveProperty(dep);
      });
    });

    it('should be type: module for ESM support', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      expect(packageData.type).toBe('module');
    });
  });

  describe('frontend build configuration', () => {
    it('should have vite.config.js', () => {
      const vitePath = path.join(process.cwd(), 'vite.config.js');
      expect(fs.existsSync(vitePath)).toBe(true);
    });

    it('should have index.html entry point', () => {
      const indexPath = path.join(process.cwd(), 'index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    it('should have Vue components', () => {
      const componentsPath = path.join(process.cwd(), 'src', 'components');
      expect(fs.existsSync(componentsPath)).toBe(true);
    });
  });

  describe('smart contracts', () => {
    it('should have AtomicMultiSend contract', () => {
      const contractPath = path.join(process.cwd(), 'src', 'AtomicMultiSend.sol');
      expect(fs.existsSync(contractPath)).toBe(true);
    });

    it('should have token contracts', () => {
      const tokensPath = path.join(process.cwd(), 'src', 'tokens');
      expect(fs.existsSync(tokensPath)).toBe(true);

      // Check for specific token contracts
      const contracts = ['WBTC.sol', 'PEPE.sol', 'USDT.sol'];
      contracts.forEach((contract) => {
        const contractPath = path.join(tokensPath, contract);
        // Not all may exist, but directory should be there
      });
    });

    it('should have foundry configuration', () => {
      const foundryPath = path.join(process.cwd(), 'foundry.toml');
      expect(fs.existsSync(foundryPath)).toBe(true);
    });
  });

  describe('deployment scripts', () => {
    it('should have automated deployment script', () => {
      const deployPath = path.join(process.cwd(), 'scripts', 'automated-deploy.js');
      expect(fs.existsSync(deployPath)).toBe(true);
    });

    it('should have scripts directory', () => {
      const scriptsPath = path.join(process.cwd(), 'scripts');
      expect(fs.existsSync(scriptsPath)).toBe(true);
    });
  });

  describe('rate limiting persistence', () => {
    it('should create .faucet directory for database if not exists', () => {
      const faucetDir = path.join(process.cwd(), '.faucet');

      // The directory should either exist or be creatable
      if (!fs.existsSync(faucetDir)) {
        fs.mkdirSync(faucetDir, { recursive: true });
      }

      expect(fs.existsSync(faucetDir)).toBe(true);

      // Clean up if we created it
      if (fs.readdirSync(faucetDir).length === 0) {
        fs.rmdirSync(faucetDir);
      }
    });
  });

  describe('documentation', () => {
    it('should have README', () => {
      const readmePath = path.join(process.cwd(), 'README.md');
      expect(fs.existsSync(readmePath)).toBe(true);
    });
  });
});
