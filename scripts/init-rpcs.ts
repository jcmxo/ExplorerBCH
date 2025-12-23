import * as dotenv from 'dotenv';
import { RPCManager } from '../src/database/rpc-manager';
import { Database } from '../src/config/database';

dotenv.config();

/**
 * Initialize common RPC endpoints
 * Add your own RPC URLs here or via environment variables
 */
async function initRPCs() {
  try {
    await Database.getPool();

    // Common public RPCs (add your own private RPCs)
    const rpcs = [
      { name: 'llamarpc-mainnet', url: 'https://eth.llamarpc.com' },
      { name: 'publicnode-mainnet', url: 'https://ethereum.publicnode.com' },
      // Add more RPCs here or via environment variables
      // Example: { name: 'infura-mainnet', url: process.env.INFURA_URL },
    ];

    console.log('Initializing RPC endpoints...');

    for (const rpc of rpcs) {
      if (rpc.url) {
        const id = await RPCManager.addRPC(rpc.name, rpc.url);
        console.log(`✓ Added RPC: ${rpc.name} (ID: ${id})`);
      }
    }

    console.log('\n✅ RPC initialization complete!');
    console.log('💡 Add more RPCs using: npm run add-rpc');

    await Database.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

initRPCs();

