import { RPCManager } from '../../src/database/rpc-manager';
import { Database } from '../../src/config/database';

// Mock database
jest.mock('../../src/config/database');

describe('RPCManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableRPC', () => {
    it('should return RPC with lowest fail count', async () => {
      const mockRPC = {
        id: 1,
        name: 'test-rpc',
        url: 'http://localhost:8545',
        active: true,
        fail_count: 0,
        last_error: null,
        last_used_at: null,
      };

      (Database.query as jest.Mock).mockResolvedValue({
        rows: [mockRPC],
      });

      const rpc = await RPCManager.getAvailableRPC();

      expect(rpc).toBeTruthy();
      expect(rpc?.id).toBe(1);
      expect(rpc?.name).toBe('test-rpc');
    });

    it('should return null when no active RPCs available', async () => {
      (Database.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const rpc = await RPCManager.getAvailableRPC();
      expect(rpc).toBeNull();
    });
  });

  describe('recordSuccess', () => {
    it('should reset fail count and update last_used_at', async () => {
      (Database.query as jest.Mock).mockResolvedValue({ rows: [] });

      await RPCManager.recordSuccess(1);

      expect(Database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE rpcs'),
        [1]
      );
    });
  });

  describe('recordFailure', () => {
    it('should increment fail count', async () => {
      (Database.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ fail_count: 3 }],
        })
        .mockResolvedValueOnce({ rows: [] });

      await RPCManager.recordFailure(1, 'Test error');

      expect(Database.query).toHaveBeenCalled();
    });

    it('should deactivate RPC when threshold exceeded', async () => {
      const failThreshold = 5;
      (Database.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ fail_count: failThreshold }],
        })
        .mockResolvedValueOnce({ rows: [] });

      await RPCManager.recordFailure(1, 'Test error');

      expect(Database.query).toHaveBeenCalledTimes(2);
      expect(Database.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE rpcs SET active = false'),
        [1]
      );
    });
  });
});

