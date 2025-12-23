import * as dotenv from 'dotenv';
import * as readline from 'readline';
import { RPCManager } from '../src/database/rpc-manager';
import { Database } from '../src/config/database';

dotenv.config();

/**
 * Script to add RPC endpoints to the database
 */
async function addRPC() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  try {
    await Database.getPool();

    const name = await question('RPC Name (e.g., "infura-mainnet"): ');
    const url = await question('RPC URL: ');

    if (!name || !url) {
      console.error('❌ Name and URL are required');
      process.exit(1);
    }

    const id = await RPCManager.addRPC(name, url);
    console.log(`✅ RPC added with ID: ${id}`);

    rl.close();
    await Database.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addRPC();

