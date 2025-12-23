import { EventProcessor } from '../../src/services/event-processor';

// Mock database and resolver
jest.mock('../../src/config/database');
jest.mock('../../src/services/event-signature-resolver', () => ({
  EventSignatureResolver: {
    resolve: jest.fn().mockResolvedValue('Transfer'),
  },
}));

describe('EventProcessor', () => {
  describe('processLogs', () => {
    it('should process empty logs array', async () => {
      const count = await EventProcessor.processLogs([]);
      expect(count).toBe(0);
    });

    it('should extract event signature from topic[0]', async () => {
      const mockLog: any = {
        blockNumber: 1000n,
        blockHash: '0x123',
        transactionHash: '0x456',
        address: '0x789',
        topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
        data: '0x',
      };

      // Mock database insert
      const mockClient = {
        query: jest.fn().mockResolvedValue({}),
        release: jest.fn(),
      };
      const { Database } = require('../../src/config/database');
      Database.getClient = jest.fn().mockResolvedValue(mockClient);

      const count = await EventProcessor.processLogs([mockLog]);

      expect(count).toBe(1);
      expect(mockClient.query).toHaveBeenCalled();
    });
  });
});

