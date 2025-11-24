import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FrequencyChecker } from '../checker.js';

describe('FrequencyChecker', () => {
  let checker;
  const testDbPath = '.faucet-test/history-test.db';
  const testConfig = {
    db: { path: testDbPath },
    blockchain: {
      limit: {
        address: 1,
        ip: 10,
      },
    },
  };

  beforeEach(() => {
    // Clean up test database before each test
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }

    // Create new checker instance
    checker = new FrequencyChecker(testConfig);
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
    } catch (_err) {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    it('should initialize with correct limits', () => {
      expect(checker.limits.address).toBe(1);
      expect(checker.limits.ip).toBe(10);
    });

    it('should use default limits if not provided', () => {
      const defaultChecker = new FrequencyChecker({
        db: { path: '.faucet-test/default.db' },
        blockchain: {},
      });

      expect(defaultChecker.limits.address).toBe(1);
      expect(defaultChecker.limits.ip).toBe(10);

      // Cleanup
      if (fs.existsSync('.faucet-test/default.db')) {
        fs.unlinkSync('.faucet-test/default.db');
      }
    });

    it('should create database directory if it does not exist', () => {
      const dbDir = path.dirname(testDbPath);
      expect(fs.existsSync(dbDir)).toBe(true);
    });

    it('should initialize requests map', () => {
      expect(checker.requests).toBeInstanceOf(Map);
    });
  });

  describe('loadData', () => {
    it('should load persisted data from disk', () => {
      // Create test data
      const testData = {
        requests: [
          ['addr_test123_cosmos', [Date.now()]],
          ['ip_192.168.1.1_cosmos', [Date.now()]],
        ],
        lastSaved: new Date().toISOString(),
      };

      // Ensure directory exists
      const dbDir = path.dirname(testDbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      fs.writeFileSync(testDbPath, JSON.stringify(testData));

      // Create new checker that will load data
      const newChecker = new FrequencyChecker(testConfig);

      expect(newChecker.requests.size).toBe(2);
      expect(newChecker.requests.has('addr_test123_cosmos')).toBe(true);
      expect(newChecker.requests.has('ip_192.168.1.1_cosmos')).toBe(true);
    });

    it('should handle missing database file gracefully', () => {
      // Should not throw even if file doesn't exist
      expect(() => new FrequencyChecker(testConfig)).not.toThrow();
    });

    it('should handle corrupted database file', () => {
      const dbDir = path.dirname(testDbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      fs.writeFileSync(testDbPath, 'corrupted json data');

      // Should not throw, should initialize with empty map
      const newChecker = new FrequencyChecker(testConfig);
      expect(newChecker.requests.size).toBe(0);
    });
  });

  describe('saveData', () => {
    it('should persist data to disk', () => {
      checker.requests.set('addr_test_cosmos', [Date.now()]);
      checker.saveData();

      expect(fs.existsSync(testDbPath)).toBe(true);

      const savedData = JSON.parse(fs.readFileSync(testDbPath, 'utf8'));
      expect(savedData).toHaveProperty('requests');
      expect(savedData).toHaveProperty('lastSaved');
      expect(savedData.requests).toHaveLength(1);
    });

    it('should handle save errors gracefully', () => {
      // Make directory read-only to cause save error
      const dbDir = path.dirname(testDbPath);
      const originalMode = fs.statSync(dbDir).mode;

      try {
        fs.chmodSync(dbDir, 0o444);
        expect(() => checker.saveData()).not.toThrow();
      } finally {
        // Restore permissions
        fs.chmodSync(dbDir, originalMode);
      }
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      const now = Date.now();
      const oldTimestamp = now - 25 * 60 * 60 * 1000; // 25 hours ago (expired)
      const recentTimestamp = now - 1 * 60 * 60 * 1000; // 1 hour ago (valid)

      checker.requests.set('addr_old_cosmos', [oldTimestamp]);
      checker.requests.set('addr_recent_cosmos', [recentTimestamp]);
      checker.requests.set('addr_mixed_cosmos', [oldTimestamp, recentTimestamp]);

      checker.cleanup();

      expect(checker.requests.has('addr_old_cosmos')).toBe(false);
      expect(checker.requests.has('addr_recent_cosmos')).toBe(true);
      expect(checker.requests.has('addr_mixed_cosmos')).toBe(true);
      expect(checker.requests.get('addr_mixed_cosmos')).toHaveLength(1);
    });

    it('should not remove entries within time window', () => {
      const now = Date.now();
      checker.requests.set('addr_test1_cosmos', [now]);
      checker.requests.set('addr_test2_cosmos', [now - 1000]);

      checker.cleanup();

      expect(checker.requests.size).toBe(2);
    });
  });

  describe('checkAddress', () => {
    it('should allow first request from new address', async () => {
      const allowed = await checker.checkAddress('cosmos1test', 'cosmos');
      expect(allowed).toBe(true);
    });

    it('should block request after limit reached', async () => {
      const address = 'cosmos1test';
      const type = 'cosmos';

      // First request should be allowed
      const firstCheck = await checker.checkAddress(address, type);
      expect(firstCheck).toBe(true);

      // Update to record the request
      checker.update(`addr_${address}_${type}`);

      // Second request should be blocked (limit is 1)
      const secondCheck = await checker.checkAddress(address, type);
      expect(secondCheck).toBe(false);
    });

    it('should allow request after time window expires', async () => {
      const address = 'cosmos1test';
      const type = 'cosmos';
      const key = `addr_${address}_${type}`;

      // Add old timestamp (outside 24h window)
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000;
      checker.requests.set(key, [oldTimestamp]);

      // Should be allowed since old request is expired
      const allowed = await checker.checkAddress(address, type);
      expect(allowed).toBe(true);
    });
  });

  describe('checkIp', () => {
    it('should allow first request from new IP', async () => {
      const allowed = await checker.checkIp('192.168.1.1', 'cosmos');
      expect(allowed).toBe(true);
    });

    it('should allow multiple requests up to limit', async () => {
      const ip = '192.168.1.1';
      const type = 'cosmos';
      const key = `ip_${ip}_${type}`;

      // IP limit is 10, so should allow 10 requests
      for (let i = 0; i < 10; i++) {
        const allowed = await checker.checkIp(ip, type);
        expect(allowed).toBe(true);
        checker.update(key);
      }

      // 11th request should be blocked
      const eleventhCheck = await checker.checkIp(ip, type);
      expect(eleventhCheck).toBe(false);
    });

    it('should block request after IP limit reached', async () => {
      const ip = '192.168.1.1';
      const type = 'cosmos';
      const key = `ip_${ip}_${type}`;

      // Add 10 recent timestamps (at the limit)
      const now = Date.now();
      const timestamps = Array.from({ length: 10 }, (_, i) => now - i * 1000);
      checker.requests.set(key, timestamps);

      // Should be blocked
      const allowed = await checker.checkIp(ip, type);
      expect(allowed).toBe(false);
    });
  });

  describe('checkLimit', () => {
    it('should return true when under limit', () => {
      const allowed = checker.checkLimit('test_key', 5, 'test entity');
      expect(allowed).toBe(true);
    });

    it('should return false when at or over limit', () => {
      const key = 'test_key';
      const limit = 3;

      // Add 3 recent timestamps
      const now = Date.now();
      checker.requests.set(key, [now, now - 1000, now - 2000]);

      const allowed = checker.checkLimit(key, limit, 'test entity');
      expect(allowed).toBe(false);
    });

    it('should filter out expired timestamps', () => {
      const key = 'test_key';
      const limit = 2;
      const now = Date.now();

      // Add mix of valid and expired timestamps
      checker.requests.set(key, [
        now - 25 * 60 * 60 * 1000, // Expired
        now - 1 * 60 * 60 * 1000, // Valid
      ]);

      // Should be allowed since only 1 valid timestamp remains
      const allowed = checker.checkLimit(key, limit, 'test entity');
      expect(allowed).toBe(true);
    });
  });

  describe('update', () => {
    it('should add timestamp to existing key', () => {
      const key = 'test_key';
      const initialTimestamp = Date.now() - 1000;

      checker.requests.set(key, [initialTimestamp]);
      checker.update(key);

      const timestamps = checker.requests.get(key);
      expect(timestamps).toHaveLength(2);
      expect(timestamps[1]).toBeGreaterThan(initialTimestamp);
    });

    it('should create new entry for new key', () => {
      const key = 'new_key';
      expect(checker.requests.has(key)).toBe(false);

      checker.update(key);

      expect(checker.requests.has(key)).toBe(true);
      expect(checker.requests.get(key)).toHaveLength(1);
    });
  });

  describe('getRemainingTime', () => {
    it('should return 0 for new address', async () => {
      const remaining = await checker.getRemainingTime('cosmos1new', 'cosmos');
      expect(remaining).toBe(0);
    });

    it('should return remaining time until oldest request expires', async () => {
      const address = 'cosmos1test';
      const type = 'cosmos';
      const key = `addr_${address}_${type}`;

      // Add timestamp 23 hours ago
      const timestamp = Date.now() - 23 * 60 * 60 * 1000;
      checker.requests.set(key, [timestamp]);

      const remaining = await checker.getRemainingTime(address, type);

      // Should be approximately 1 hour remaining (with some tolerance)
      expect(remaining).toBeGreaterThan(55 * 60 * 1000); // > 55 minutes
      expect(remaining).toBeLessThan(65 * 60 * 1000); // < 65 minutes
    });

    it('should return 0 if all timestamps are expired', async () => {
      const address = 'cosmos1test';
      const type = 'cosmos';
      const key = `addr_${address}_${type}`;

      // Add old timestamp (outside window)
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000;
      checker.requests.set(key, [oldTimestamp]);

      const remaining = await checker.getRemainingTime(address, type);
      expect(remaining).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const now = Date.now();

      // Add some test data
      checker.requests.set('addr_1_cosmos', [now]);
      checker.requests.set('addr_2_cosmos', [now, now - 1000]);
      checker.requests.set('addr_old_cosmos', [now - 25 * 60 * 60 * 1000]); // Expired

      const stats = checker.getStats();

      expect(stats.activeEntries).toBe(2); // Only non-expired entries
      expect(stats.totalRequests).toBe(3); // Total valid timestamps
      expect(stats.windowHours).toBe(24);
      expect(stats.limits).toEqual({
        address: 1,
        ip: 10,
      });
    });

    it('should return zero stats for empty checker', () => {
      const stats = checker.getStats();

      expect(stats.activeEntries).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.windowHours).toBe(24);
    });
  });

  describe('persistence across instances', () => {
    it('should persist data across checker instances', async () => {
      const address = 'cosmos1persist';
      const type = 'cosmos';

      // First instance - make a request
      const checker1 = new FrequencyChecker(testConfig);
      const allowed1 = await checker1.checkAddress(address, type);
      expect(allowed1).toBe(true);

      checker1.update(`addr_${address}_${type}`);
      checker1.saveData();

      // Second instance - should remember the request
      const checker2 = new FrequencyChecker(testConfig);
      const allowed2 = await checker2.checkAddress(address, type);
      expect(allowed2).toBe(false); // Should be blocked
    });
  });
});
