import { ethers } from 'ethers';
import { Database } from '../config/database';
import { EventSignatureResolver } from './event-signature-resolver';

export interface ProcessedEvent {
  blockNumber: bigint;
  blockHash: string;
  transactionHash: string;
  contractAddress: string;
  eventSignature: string;
  eventName: string;
  params: string[];
}

/**
 * Processes Ethereum logs and stores them in the database
 */
export class EventProcessor {
  /**
   * Process logs from eth_getLogs response
   */
  static async processLogs(logs: ethers.Log[]): Promise<number> {
    if (logs.length === 0) {
      return 0;
    }

    const events: ProcessedEvent[] = [];

    for (const log of logs) {
      try {
        const eventSignature = log.topics[0] || '0x';
        const eventName = await EventSignatureResolver.resolve(eventSignature);

        // Extract parameters from topics and data
        const params: string[] = [];
        
        // Topics 1-3 are indexed parameters
        for (let i = 1; i < log.topics.length && i <= 3; i++) {
          params.push(log.topics[i]);
        }

        // Decode data field for non-indexed parameters
        // Note: This is simplified - full decoding would require ABI
        if (log.data && log.data !== '0x') {
          // Try to decode as much as possible
          // For simplicity, we'll store hex data and let users decode later
          // In production, you might want to use ABI decoding
          const dataParams = this.decodeDataParams(log.data);
          params.push(...dataParams);
        }

        events.push({
          blockNumber: BigInt(log.blockNumber.toString()),
          blockHash: log.blockHash || '',
          transactionHash: log.transactionHash || '',
          contractAddress: log.address.toLowerCase(),
          eventSignature,
          eventName,
          params,
        });
      } catch (error) {
        console.error(`Error processing log:`, error);
      }
    }

    // Batch insert events
    if (events.length > 0) {
      await this.insertEvents(events);
    }

    return events.length;
  }

  /**
   * Decode data parameters (simplified - stores hex values)
   */
  private static decodeDataParams(data: string): string[] {
    const params: string[] = [];
    
    // Remove '0x' prefix
    const hexData = data.startsWith('0x') ? data.slice(2) : data;
    
    // Each parameter is 32 bytes (64 hex chars)
    const paramSize = 64;
    for (let i = 0; i < hexData.length; i += paramSize) {
      const param = '0x' + hexData.slice(i, i + paramSize);
      if (param !== '0x' && param.length === 66) {
        params.push(param);
      }
    }

    return params;
  }

  /**
   * Insert events into database
   */
  private static async insertEvents(events: ProcessedEvent[]): Promise<void> {
    const client = await Database.getClient();

    try {
      await client.query('BEGIN');

      for (const event of events) {
        // Pad params array to 18 elements
        const params: (string | null)[] = [...event.params];
        while (params.length < 18) {
          params.push(null);
        }

        await client.query(
          `INSERT INTO events (
            block_number, block_hash, transaction_hash, contract_address,
            event_signature, event_name,
            param1, param2, param3, param4, param5, param6, param7, param8, param9, param10,
            param11, param12, param13, param14, param15, param16, param17, param18
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
          [
            event.blockNumber.toString(),
            event.blockHash,
            event.transactionHash,
            event.contractAddress,
            event.eventSignature,
            event.eventName,
            params[0], params[1], params[2], params[3], params[4], params[5],
            params[6], params[7], params[8], params[9], params[10], params[11],
            params[12], params[13], params[14], params[15], params[16], params[17],
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

