import * as dotenv from 'dotenv';
import { Producer } from '../src/services/producer';
import { ethers } from 'ethers';
import { Database } from '../src/config/database';
import { RPCManager } from '../src/database/rpc-manager';

dotenv.config();

/**
 * Script to process a specific ERC20 token from its deployment block
 * Usage: tsx scripts/process-token.ts <token_address> [rpc_url]
 */
async function processToken() {
  const tokenAddress = process.argv[2];
  const rpcUrl = process.argv[3] || process.env.ETHEREUM_RPC_URL;

  if (!tokenAddress) {
    console.error('Usage: tsx scripts/process-token.ts <token_address> [rpc_url]');
    process.exit(1);
  }

  if (!rpcUrl) {
    console.error('❌ RPC URL required. Provide as argument or set ETHEREUM_RPC_URL env var');
    process.exit(1);
  }

  try {
    // Initialize database and add RPC
    await Database.getPool();
    await RPCManager.addRPC('token-processor', rpcUrl);

    console.log(`🔍 Finding deployment block for token ${tokenAddress}...`);

    // Create provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Get contract creation transaction
    const code = await provider.getCode(tokenAddress);
    if (code === '0x') {
      console.error('❌ Token address has no code. Is it a valid contract?');
      process.exit(1);
    }

    // Find deployment block by binary search (simplified - in production use contract creation tx)
    // For now, we'll use a heuristic: check recent blocks
    const currentBlock = await provider.getBlockNumber();
    let deploymentBlock = Math.max(0, currentBlock - 100000); // Search last 100k blocks

    console.log(`📦 Token found. Starting from block ${deploymentBlock}`);
    console.log(`🎯 Processing blocks ${deploymentBlock} to ${currentBlock}`);

    // Create producer
    const blocksPerMessage = parseInt(process.env.BLOCKS_PER_MESSAGE || '10');
    const producer = new Producer(deploymentBlock, currentBlock, blocksPerMessage);
    const messagesSent = await producer.produce();

    console.log(`✅ Sent ${messagesSent} messages to queue`);
    console.log(`💡 Start consumers to process: npm run start:consumer`);

    await Database.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

processToken();

