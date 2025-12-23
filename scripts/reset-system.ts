import * as readline from 'readline';
import { Database } from '../src/config/database';
import { RabbitMQ } from '../src/config/rabbitmq';

/**
 * Reset system script - truncates tables and clears RabbitMQ queues
 * Requires explicit "SI" confirmation
 */
async function resetSystem() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log('⚠️  WARNING: This will delete ALL data from the system!');
  console.log('This includes:');
  console.log('  - All events');
  console.log('  - All consumer metrics');
  console.log('  - All RPC configurations (will be reset)');
  console.log('  - All RabbitMQ queues');
  console.log('');

  const answer = await new Promise<string>((resolve) => {
    rl.question('Type "SI" (uppercase) to confirm: ', (input) => {
      resolve(input);
    });
  });

  rl.close();

  if (answer !== 'SI') {
    console.log('Reset cancelled.');
    process.exit(0);
  }

  console.log('Starting system reset...');

  try {
    // Connect to database
    console.log('Connecting to database...');
    await Database.getPool();

    // Truncate tables
    console.log('Truncating tables...');
    await Database.query('TRUNCATE TABLE events CASCADE');
    await Database.query('TRUNCATE TABLE consumer_metrics CASCADE');
    await Database.query('TRUNCATE TABLE rpcs CASCADE');
    await Database.query('TRUNCATE TABLE event_signatures CASCADE');
    console.log('✓ Tables truncated');

    // Connect to RabbitMQ and purge queues
    console.log('Connecting to RabbitMQ...');
    await RabbitMQ.connect();

    const mainQueue = process.env.RABBITMQ_QUEUE || 'ethereum_blocks_queue';
    const retryQueue = process.env.RABBITMQ_RETRY_QUEUE || 'ethereum_blocks_retry';
    const dlq = process.env.RABBITMQ_DLQ || 'ethereum_blocks_dlq';

    console.log('Purging queues...');
    await RabbitMQ.purgeQueue(mainQueue);
    await RabbitMQ.purgeQueue(retryQueue);
    await RabbitMQ.purgeQueue(dlq);
    console.log('✓ Queues purged');

    // Close connections
    await RabbitMQ.close();
    await Database.close();

    console.log('');
    console.log('✅ System reset completed successfully!');
  } catch (error) {
    console.error('❌ Error during reset:', error);
    process.exit(1);
  }
}

resetSystem();

