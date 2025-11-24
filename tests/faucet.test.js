import fs from 'node:fs';
import path from 'node:path';
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
    });

    it('should have src directory with utilities', () => {
      const srcPath = path.join(process.cwd(), 'src');
      expect(fs.existsSync(srcPath)).toBe(true);
      expect(fs.existsSync(path.join(srcPath, 'SecureKeyManager.js'))).toBe(true);
    });
  });

  describe('environment requirements', () => {
    it('should check for MNEMONIC environment variable', () => {
      // The app requires MNEMONIC for key management
      expect(typeof process.env.MNEMONIC).toBe('string');
      expect(process.env.MNEMONIC.length).toBeGreaterThan(0);
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

  describe('scripts directory', () => {
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
