import * as dotenv from 'dotenv';
import { Consumer } from '../src/services/consumer';
import { Database } from '../src/config/database';
import { EventSignatureResolver } from '../src/services/event-signature-resolver';

dotenv.config();

/**
 * Consumer script - processes block ranges from RabbitMQ
 */
async function startConsumer() {
  const consumerId = process.env.CONSUMER_ID || `consumer-${Date.now()}`;
  const maxRetries = parseInt(process.env.MAX_RETRIES || '3');

  console.log('🔄 Starting Consumer...');
  console.log(`   Consumer ID: ${consumerId}`);
  console.log(`   Max Retries: ${maxRetries}`);
  console.log('');

  try {
    // Initialize database connection
    await Database.getPool();
    console.log('✓ Database connected');

    // Preload common event signatures
    console.log('Preloading common event signatures...');
    await EventSignatureResolver.preloadCommonSignatures();
    console.log('✓ Event signatures preloaded');

    // Start consumer
    const consumer = new Consumer(consumerId, maxRetries);
    await consumer.start();

    // Keep process alive
    console.log('Consumer is running. Press Ctrl+C to stop.');
    process.on('SIGINT', async () => {
      console.log('\nShutting down consumer...');
      await Database.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Consumer error:', error);
    process.exit(1);
  }
}

startConsumer();

