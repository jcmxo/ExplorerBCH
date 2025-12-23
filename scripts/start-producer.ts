import * as dotenv from 'dotenv';
import { Producer } from '../src/services/producer';

dotenv.config();

/**
 * Producer script - divides block range into chunks and sends to RabbitMQ
 */
async function startProducer() {
  // Validate required environment variables
  const startBlockStr = process.env.ETHEREUM_START_BLOCK;
  const endBlockStr = process.env.ETHEREUM_END_BLOCK;
  const blocksPerMessageStr = process.env.BLOCKS_PER_MESSAGE;

  if (!startBlockStr) {
    console.error('❌ Error: ETHEREUM_START_BLOCK environment variable is required');
    console.error('   Please set ETHEREUM_START_BLOCK in your .env file');
    process.exit(1);
  }

  if (!endBlockStr) {
    console.error('❌ Error: ETHEREUM_END_BLOCK environment variable is required');
    console.error('   Please set ETHEREUM_END_BLOCK in your .env file');
    process.exit(1);
  }

  if (!blocksPerMessageStr) {
    console.error('❌ Error: BLOCKS_PER_MESSAGE environment variable is required');
    console.error('   Please set BLOCKS_PER_MESSAGE in your .env file');
    process.exit(1);
  }

  // Parse and validate numeric values
  const startBlock = parseInt(startBlockStr, 10);
  const endBlock = parseInt(endBlockStr, 10);
  const blocksPerMessage = parseInt(blocksPerMessageStr, 10);

  if (isNaN(startBlock)) {
    console.error(`❌ Error: ETHEREUM_START_BLOCK must be a valid number, got: "${startBlockStr}"`);
    process.exit(1);
  }

  if (isNaN(endBlock)) {
    console.error(`❌ Error: ETHEREUM_END_BLOCK must be a valid number, got: "${endBlockStr}"`);
    process.exit(1);
  }

  if (isNaN(blocksPerMessage)) {
    console.error(`❌ Error: BLOCKS_PER_MESSAGE must be a valid number, got: "${blocksPerMessageStr}"`);
    process.exit(1);
  }

  // Calculate total messages before validation
  const totalBlocks = endBlock - startBlock + 1;
  const totalMessages = Math.ceil(totalBlocks / blocksPerMessage);

  // Print configuration
  console.log('🚀 Starting Producer...');
  console.log(`   Start Block: ${startBlock}`);
  console.log(`   End Block: ${endBlock}`);
  console.log(`   Blocks per Message: ${blocksPerMessage}`);
  console.log(`   Total Blocks: ${totalBlocks}`);
  console.log(`   Total Messages to send: ${totalMessages}`);
  console.log('');

  // Validation: startBlock < endBlock
  if (startBlock >= endBlock) {
    console.error(`❌ Error: startBlock (${startBlock}) must be < endBlock (${endBlock})`);
    process.exit(1);
  }

  // Validation: blocksPerMessage > 0
  if (blocksPerMessage <= 0) {
    console.error(`❌ Error: blocksPerMessage (${blocksPerMessage}) must be > 0`);
    process.exit(1);
  }

  // Warning for large ranges
  if (totalBlocks > 100000) {
    console.warn(`⚠️  Warning: Processing large range (${totalBlocks} blocks, ${totalMessages} messages)`);
    console.warn('   This may take a long time and consume significant resources.');
    console.warn('');
  }

  // Check for DRY_RUN mode
  const isDryRun = process.env.DRY_RUN === 'true';
  if (isDryRun) {
    console.log('🔍 DRY_RUN mode enabled - no messages will be sent to RabbitMQ');
    console.log('');
  }

  try {
    const producer = new Producer(startBlock, endBlock, blocksPerMessage);
    const messagesSent = await producer.produce(isDryRun);

    console.log('');
    if (isDryRun) {
      console.log(`✅ Producer completed! Would have sent ${messagesSent} messages (DRY_RUN mode).`);
    } else {
      console.log(`✅ Producer completed! Sent ${messagesSent} messages.`);
    }
  } catch (error) {
    console.error('❌ Producer error:', error);
    process.exit(1);
  }
}

startProducer();

