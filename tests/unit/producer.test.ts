import { Producer } from '../../src/services/producer';

describe('Producer', () => {
  describe('generateChunks', () => {
    it('should generate correct chunks for small range', () => {
      const producer = new Producer(0, 9, 10);
      const chunks = (producer as any).generateChunks();

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({ startBlock: 0, endBlock: 9 });
    });

    it('should generate multiple chunks', () => {
      const producer = new Producer(0, 29, 10);
      const chunks = (producer as any).generateChunks();

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual({ startBlock: 0, endBlock: 9 });
      expect(chunks[1]).toEqual({ startBlock: 10, endBlock: 19 });
      expect(chunks[2]).toEqual({ startBlock: 20, endBlock: 29 });
    });

    it('should handle non-divisible ranges', () => {
      const producer = new Producer(0, 25, 10);
      const chunks = (producer as any).generateChunks();

      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toEqual({ startBlock: 0, endBlock: 9 });
      expect(chunks[1]).toEqual({ startBlock: 10, endBlock: 19 });
      expect(chunks[2]).toEqual({ startBlock: 20, endBlock: 25 });
    });

    it('should handle single block range', () => {
      const producer = new Producer(100, 100, 10);
      const chunks = (producer as any).generateChunks();

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({ startBlock: 100, endBlock: 100 });
    });
  });
});

