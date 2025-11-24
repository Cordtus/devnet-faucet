import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TokenAllowanceTracker } from '../tokenAllowance.js';

describe('TokenAllowanceTracker', () => {
  let tracker;
  const testDbPath = '.faucet-test/allowances-test.db';
  const testConfig = {
    db: { allowancePath: testDbPath },
    blockchain: {
      tx: {
        amounts: [
          { denom: 'wbtc', amount: '100000000' }, // 1 WBTC (8 decimals)
          { denom: 'usdt', amount: '1000000000' }, // 1000 USDT (6 decimals)
          { denom: 'atom', amount: '10000000000000000000' }, // 10 ATOM (18 decimals)
        ],
      },
    },
  };

  beforeEach(() => {
    // Clean up test database before each test
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create new tracker instance
    tracker = new TokenAllowanceTracker(testConfig);
  });

  afterEach(() => {
    // Clean up test database and directory
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
      const dbDir = path.dirname(testDbPath);
      if (fs.existsSync(dbDir)) {
        fs.rmSync(dbDir, { recursive: true, force: true });
      }
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should initialize with correct daily limits', () => {
      expect(tracker.dailyLimits.size).toBe(3);
      expect(tracker.dailyLimits.get('wbtc')).toBe(1000000000n); // 10 WBTC
      expect(tracker.dailyLimits.get('usdt')).toBe(10000000000n); // 10000 USDT
      expect(tracker.dailyLimits.get('atom')).toBe(100000000000000000000n); // 100 ATOM
    });

    it('should create database directory if not exists', () => {
      const dbDir = path.dirname(testDbPath);
      expect(fs.existsSync(dbDir)).toBe(true);
    });

    it('should initialize empty allowances map', () => {
      expect(tracker.allowances).toBeInstanceOf(Map);
      expect(tracker.allowances.size).toBe(0);
    });
  });

  describe('initializeLimits', () => {
    it('should set daily limit to 10x single amount', () => {
      const wbtcSingleAmount = 100000000n;
      const wbtcDailyLimit = tracker.dailyLimits.get('wbtc');

      expect(wbtcDailyLimit).toBe(wbtcSingleAmount * 10n);
    });

    it('should handle zero amounts', () => {
      const configWithZero = {
        db: { allowancePath: '.faucet-test/zero.db' },
        blockchain: {
          tx: {
            amounts: [{ denom: 'zero', amount: '0' }],
          },
        },
      };

      const zeroTracker = new TokenAllowanceTracker(configWithZero);
      expect(zeroTracker.dailyLimits.get('zero')).toBe(0n);

      // Cleanup
      if (fs.existsSync('.faucet-test/zero.db')) {
        fs.unlinkSync('.faucet-test/zero.db');
      }
    });
  });

  describe('loadData and saveData', () => {
    it('should persist and load allowance data', () => {
      const address = 'cosmos1test';
      const distributedTokens = new Map([
        ['wbtc', '100000000'],
        ['usdt', '1000000000'],
      ]);

      tracker.updateAllowance(address, distributedTokens);
      tracker.saveData();

      // Load in new instance
      const newTracker = new TokenAllowanceTracker(testConfig);
      expect(newTracker.allowances.size).toBe(1);
      expect(newTracker.allowances.has(address)).toBe(true);
    });

    it('should handle missing database file gracefully', () => {
      expect(() => new TokenAllowanceTracker(testConfig)).not.toThrow();
    });

    it('should handle corrupted database file', () => {
      const dbDir = path.dirname(testDbPath);

      // Ensure clean state and directory exists
      try {
        if (fs.existsSync(testDbPath)) {
          fs.unlinkSync(testDbPath);
        }
      } catch (err) {
        // Ignore
      }

      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      fs.writeFileSync(testDbPath, 'corrupted json');

      const newTracker = new TokenAllowanceTracker(testConfig);
      expect(newTracker.allowances.size).toBe(0);

      // Cleanup
      try {
        fs.unlinkSync(testDbPath);
      } catch (err) {
        // Ignore
      }
    });
  });

  describe('cleanup', () => {
    it('should remove expired allowance entries', () => {
      const address1 = 'cosmos1old';
      const address2 = 'cosmos1recent';

      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
      const recentTimestamp = Date.now() - 1 * 60 * 60 * 1000; // 1 hour ago

      // Add old entry
      const oldTokens = new Map();
      oldTokens.set('wbtc', { amount: 100000000n, timestamps: [oldTimestamp] });
      tracker.allowances.set(address1, oldTokens);

      // Add recent entry
      const recentTokens = new Map();
      recentTokens.set('usdt', { amount: 1000000000n, timestamps: [recentTimestamp] });
      tracker.allowances.set(address2, recentTokens);

      tracker.cleanup();

      expect(tracker.allowances.has(address1)).toBe(false);
      expect(tracker.allowances.has(address2)).toBe(true);
    });

    it('should recalculate amounts after removing expired timestamps', () => {
      const address = 'cosmos1mixed';
      const now = Date.now();
      const oldTimestamp = now - 25 * 60 * 60 * 1000;
      const recentTimestamp = now - 1 * 60 * 60 * 1000;

      const tokens = new Map();
      tokens.set('wbtc', {
        amount: 200000000n,
        timestamps: [oldTimestamp, recentTimestamp],
      });
      tracker.allowances.set(address, tokens);

      tracker.cleanup();

      const addressTokens = tracker.allowances.get(address);
      expect(addressTokens.has('wbtc')).toBe(true);
      expect(addressTokens.get('wbtc').timestamps).toHaveLength(1);
      expect(addressTokens.get('wbtc').amount).toBe(100000000n); // Recalculated to single amount
    });
  });

  describe('getSingleAmount', () => {
    it('should return correct single amount for token', () => {
      expect(tracker.getSingleAmount('wbtc')).toBe(100000000n);
      expect(tracker.getSingleAmount('usdt')).toBe(1000000000n);
      expect(tracker.getSingleAmount('atom')).toBe(10000000000000000000n);
    });

    it('should return 0 for unknown token', () => {
      expect(tracker.getSingleAmount('unknown')).toBe(0n);
    });
  });

  describe('checkAllowance', () => {
    it('should allow first request for new address', async () => {
      const requestedTokens = new Map([['wbtc', '100000000']]);
      const result = await tracker.checkAllowance('cosmos1new', requestedTokens);

      expect(result.allowed).toBe(true);
      expect(result.available.get('wbtc')).toBe(1000000000n); // Full daily limit
    });

    it('should block request when daily limit exceeded', async () => {
      const address = 'cosmos1limited';
      const now = Date.now();

      // Simulate 10 previous requests (at daily limit)
      const tokens = new Map();
      const timestamps = Array.from({ length: 10 }, (_, i) => now - i * 1000);
      tokens.set('wbtc', { amount: 1000000000n, timestamps });
      tracker.allowances.set(address, tokens);

      const requestedTokens = new Map([['wbtc', '100000000']]);
      const result = await tracker.checkAllowance(address, requestedTokens);

      expect(result.allowed).toBe(false);
      expect(result.available.get('wbtc')).toBe(0n);
    });

    it('should allow request within daily limit', async () => {
      const address = 'cosmos1partial';
      const now = Date.now();

      // Simulate 5 previous requests (half of limit)
      const tokens = new Map();
      const timestamps = Array.from({ length: 5 }, (_, i) => now - i * 1000);
      tokens.set('wbtc', { amount: 500000000n, timestamps });
      tracker.allowances.set(address, tokens);

      const requestedTokens = new Map([['wbtc', '100000000']]);
      const result = await tracker.checkAllowance(address, requestedTokens);

      expect(result.allowed).toBe(true);
      expect(result.available.get('wbtc')).toBe(500000000n); // Remaining half
    });

    it('should check multiple tokens simultaneously', async () => {
      const requestedTokens = new Map([
        ['wbtc', '100000000'],
        ['usdt', '1000000000'],
      ]);

      const result = await tracker.checkAllowance('cosmos1multi', requestedTokens);

      expect(result.allowed).toBe(true);
      expect(result.available.get('wbtc')).toBe(1000000000n);
      expect(result.available.get('usdt')).toBe(10000000000n);
    });

    it('should block if any token exceeds limit', async () => {
      const address = 'cosmos1mixed';
      const now = Date.now();

      // WBTC at limit, USDT available
      const tokens = new Map();
      tokens.set('wbtc', {
        amount: 1000000000n,
        timestamps: Array.from({ length: 10 }, (_, i) => now - i * 1000),
      });
      tracker.allowances.set(address, tokens);

      const requestedTokens = new Map([
        ['wbtc', '100000000'], // Would exceed
        ['usdt', '1000000000'], // Available
      ]);

      const result = await tracker.checkAllowance(address, requestedTokens);

      expect(result.allowed).toBe(false);
      expect(result.available.get('wbtc')).toBe(0n);
      expect(result.available.get('usdt')).toBe(10000000000n);
    });

    it('should filter expired timestamps when checking', async () => {
      const address = 'cosmos1expired';
      const now = Date.now();
      const oldTimestamp = now - 25 * 60 * 60 * 1000;
      const recentTimestamp = now - 1 * 60 * 60 * 1000;

      // Mix of expired and valid timestamps
      const tokens = new Map();
      tokens.set('wbtc', {
        amount: 200000000n,
        timestamps: [oldTimestamp, recentTimestamp],
      });
      tracker.allowances.set(address, tokens);

      const requestedTokens = new Map([['wbtc', '100000000']]);
      const result = await tracker.checkAllowance(address, requestedTokens);

      // Should only count the recent timestamp
      expect(result.allowed).toBe(true);
      expect(result.available.get('wbtc')).toBe(900000000n); // 10x - 1x
    });
  });

  describe('updateAllowance', () => {
    it('should record new distribution', () => {
      const address = 'cosmos1new';
      const distributedTokens = new Map([['wbtc', '100000000']]);

      tracker.updateAllowance(address, distributedTokens);

      expect(tracker.allowances.has(address)).toBe(true);
      const addressTokens = tracker.allowances.get(address);
      expect(addressTokens.has('wbtc')).toBe(true);
      expect(addressTokens.get('wbtc').timestamps).toHaveLength(1);
    });

    it('should append to existing distributions', () => {
      const address = 'cosmos1existing';
      const distributedTokens1 = new Map([['wbtc', '100000000']]);
      const distributedTokens2 = new Map([['wbtc', '100000000']]);

      tracker.updateAllowance(address, distributedTokens1);
      tracker.updateAllowance(address, distributedTokens2);

      const addressTokens = tracker.allowances.get(address);
      expect(addressTokens.get('wbtc').timestamps).toHaveLength(2);
    });

    it('should handle multiple tokens', () => {
      const address = 'cosmos1multi';
      const distributedTokens = new Map([
        ['wbtc', '100000000'],
        ['usdt', '1000000000'],
        ['atom', '10000000000000000000'],
      ]);

      tracker.updateAllowance(address, distributedTokens);

      const addressTokens = tracker.allowances.get(address);
      expect(addressTokens.size).toBe(3);
      expect(addressTokens.has('wbtc')).toBe(true);
      expect(addressTokens.has('usdt')).toBe(true);
      expect(addressTokens.has('atom')).toBe(true);
    });
  });

  describe('getRemainingResetTime', () => {
    it('should return 0 for new address', () => {
      const remaining = tracker.getRemainingResetTime('cosmos1new');
      expect(remaining).toBe(0);
    });

    it('should return remaining time until oldest timestamp expires', () => {
      const address = 'cosmos1test';
      const timestamp = Date.now() - 23 * 60 * 60 * 1000; // 23 hours ago

      const tokens = new Map();
      tokens.set('wbtc', { amount: 100000000n, timestamps: [timestamp] });
      tracker.allowances.set(address, tokens);

      const remaining = tracker.getRemainingResetTime(address);

      // Should be approximately 1 hour remaining
      expect(remaining).toBeGreaterThan(55 * 60 * 1000); // > 55 minutes
      expect(remaining).toBeLessThan(65 * 60 * 1000); // < 65 minutes
    });

    it('should return 0 if all timestamps expired', () => {
      const address = 'cosmos1expired';
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000;

      const tokens = new Map();
      tokens.set('wbtc', { amount: 100000000n, timestamps: [oldTimestamp] });
      tracker.allowances.set(address, tokens);

      const remaining = tracker.getRemainingResetTime(address);
      expect(remaining).toBe(0);
    });

    it('should find oldest timestamp across multiple tokens', () => {
      const address = 'cosmos1multi';
      const now = Date.now();
      const oldestTimestamp = now - 23 * 60 * 60 * 1000;
      const newerTimestamp = now - 20 * 60 * 60 * 1000;

      const tokens = new Map();
      tokens.set('wbtc', { amount: 100000000n, timestamps: [newerTimestamp] });
      tokens.set('usdt', { amount: 1000000000n, timestamps: [oldestTimestamp] });
      tracker.allowances.set(address, tokens);

      const remaining = tracker.getRemainingResetTime(address);

      // Should be based on oldest timestamp (23h ago)
      expect(remaining).toBeGreaterThan(55 * 60 * 1000);
      expect(remaining).toBeLessThan(65 * 60 * 1000);
    });
  });

  describe('formatRemainingTime', () => {
    it('should format hours and minutes', () => {
      const twoHoursThirtyMin = 2 * 60 * 60 * 1000 + 30 * 60 * 1000;
      expect(tracker.formatRemainingTime(twoHoursThirtyMin)).toBe('2h 30m');
    });

    it('should format minutes only when less than 1 hour', () => {
      const thirtyMin = 30 * 60 * 1000;
      expect(tracker.formatRemainingTime(thirtyMin)).toBe('30m');
    });

    it('should handle zero time', () => {
      expect(tracker.formatRemainingTime(0)).toBe('0m');
    });

    it('should round down partial minutes', () => {
      const oneHourTwentyNineMinFiftyNineSec = 1 * 60 * 60 * 1000 + 29 * 60 * 1000 + 59 * 1000;
      expect(tracker.formatRemainingTime(oneHourTwentyNineMinFiftyNineSec)).toBe('1h 29m');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete request lifecycle', async () => {
      const address = 'cosmos1lifecycle';

      // First request - check allowance
      const requested1 = new Map([['wbtc', '100000000']]);
      const check1 = await tracker.checkAllowance(address, requested1);
      expect(check1.allowed).toBe(true);

      // Distribute tokens (request 1)
      tracker.updateAllowance(address, requested1);

      // Second request - should still be allowed (1 of 10)
      const check2 = await tracker.checkAllowance(address, requested1);
      expect(check2.allowed).toBe(true);

      // Make 9 more updates to reach limit (total 10)
      for (let i = 0; i < 9; i++) {
        tracker.updateAllowance(address, requested1);
      }

      // 11th request should be blocked (10 already distributed)
      const check11 = await tracker.checkAllowance(address, requested1);
      expect(check11.allowed).toBe(false);
      expect(check11.available.get('wbtc')).toBe(0n);
    });

    it('should persist allowances across tracker instances', () => {
      const address = 'cosmos1persist';
      const distributedTokens = new Map([['wbtc', '100000000']]);

      // First instance
      tracker.updateAllowance(address, distributedTokens);
      tracker.saveData();

      // Second instance
      const newTracker = new TokenAllowanceTracker(testConfig);
      expect(newTracker.allowances.has(address)).toBe(true);

      const addressTokens = newTracker.allowances.get(address);
      expect(addressTokens.has('wbtc')).toBe(true);
      expect(addressTokens.get('wbtc').timestamps).toHaveLength(1);
    });
  });
});
