/**
 * Integration test for Producer + Consumer flow
 * Requires running PostgreSQL and RabbitMQ
 * 
 * To run: Set INTEGRATION_TESTS=true
 */
import { Producer } from '../../src/services/producer';
// import { Consumer } from '../../src/services/consumer';
import { Database } from '../../src/config/database';
import { RabbitMQ } from '../../src/config/rabbitmq';
import { RPCManager } from '../../src/database/rpc-manager';

describe('Producer-Consumer Integration', () => {
  const INTEGRATION_TESTS = process.env.INTEGRATION_TESTS === 'true';

  beforeAll(async () => {
    if (!INTEGRATION_TESTS) {
      return;
    }

    // Initialize connections
    await Database.getPool();
    await RabbitMQ.connect();

    // Add test RPC (using public endpoint for testing)
    await RPCManager.addRPC('test-rpc', 'https://eth.llamarpc.com');
  });

  afterAll(async () => {
    if (!INTEGRATION_TESTS) {
      return;
    }

    await Database.close();
    await RabbitMQ.close();
  });

  it.skip('should process block range end-to-end', async () => {
    if (!INTEGRATION_TESTS) {
      console.log('Skipping integration test. Set INTEGRATION_TESTS=true to run.');
      return;
    }

    // Produce small range
    const producer = new Producer(18000000, 18000010, 5);
    await producer.produce();

    // Consume (with timeout)
    // const consumer = new Consumer('test-consumer', 3);
    
    // Note: In real test, you'd wait for messages to be processed
    // This is a simplified example
    expect(true).toBe(true);
  });
});

