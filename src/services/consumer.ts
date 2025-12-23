import { ethers } from 'ethers';
import { Database } from '../config/database';
import { RPCManager, RPC } from '../database/rpc-manager';
import { EventProcessor } from './event-processor';
import { RabbitMQ } from '../config/rabbitmq';

export interface BlockRangeMessage {
  startBlock: number;
  endBlock: number;
}

/**
 * Consumer worker that processes block ranges from RabbitMQ
 */
export class Consumer {
  private consumerId: string;
  private maxRetries: number;

  constructor(consumerId: string, maxRetries: number = 3) {
    this.consumerId = consumerId;
    this.maxRetries = maxRetries;
  }

  /**
   * Start consuming messages from RabbitMQ
   */
  async start(): Promise<void> {
    const channel = await RabbitMQ.connect();
    const queue = process.env.RABBITMQ_QUEUE || 'ethereum_blocks_queue';
    const retryQueue = process.env.RABBITMQ_RETRY_QUEUE || 'ethereum_blocks_retry';
    const dlq = process.env.RABBITMQ_DLQ || 'ethereum_blocks_dlq';

    console.log(`Consumer ${this.consumerId} started, waiting for messages...`);
    console.log(`  Main queue: ${queue}`);
    console.log(`  Retry queue: ${retryQueue}`);

    // Consume from main queue
    await channel.consume(queue, async (msg) => {
      if (!msg) {
        return;
      }

      try {
        const message: BlockRangeMessage = JSON.parse(msg.content.toString());
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0);
        
        console.log(
          `[${this.consumerId}] Processing blocks ${message.startBlock} to ${message.endBlock} ` +
          `(attempt ${retryCount + 1})`
        );

        const success = await this.processBlockRange(message, channel, queue, retryCount);

        if (success) {
          channel.ack(msg);
          console.log(
            `[${this.consumerId}] Successfully processed blocks ${message.startBlock}-${message.endBlock}`
          );
        } else {
          // Requeue with retry logic
          const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) + 1;

          if (retryCount < this.maxRetries) {
            channel.sendToQueue(retryQueue, msg.content, {
              headers: { 'x-retry-count': retryCount },
            });
            channel.ack(msg);
            console.log(
              `[${this.consumerId}] Requeued message (retry ${retryCount}/${this.maxRetries})`
            );
          } else {
            // Send to DLQ
            channel.sendToQueue(dlq, msg.content);
            channel.ack(msg);
            console.error(
              `[${this.consumerId}] Message sent to DLQ after ${retryCount} retries`
            );
          }
        }
      } catch (error) {
        console.error(`[${this.consumerId}] Error processing message:`, error);
        channel.nack(msg, false, false); // Reject and don't requeue
      }
    });

    // Also consume from retry queue
    await channel.consume(retryQueue, async (msg) => {
      if (!msg) {
        return;
      }

      try {
        const message: BlockRangeMessage = JSON.parse(msg.content.toString());
        const retryCount = (msg.properties.headers?.['x-retry-count'] || 0);
        
        console.log(
          `[${this.consumerId}] Processing retry message (attempt ${retryCount + 1}) ` +
          `for blocks ${message.startBlock} to ${message.endBlock}`
        );

        const success = await this.processBlockRange(message, channel, retryQueue, retryCount);

        if (success) {
          channel.ack(msg);
          console.log(
            `[${this.consumerId}] Successfully processed retry blocks ${message.startBlock}-${message.endBlock}`
          );
        } else {
          const newRetryCount = retryCount + 1;

          if (newRetryCount < this.maxRetries) {
            // Requeue to retry queue again
            channel.sendToQueue(retryQueue, msg.content, {
              headers: { 'x-retry-count': newRetryCount },
            });
            channel.ack(msg);
            console.log(
              `[${this.consumerId}] Requeued retry message (retry ${newRetryCount}/${this.maxRetries})`
            );
          } else {
            // Send to DLQ
            channel.sendToQueue(dlq, msg.content);
            channel.ack(msg);
            console.error(
              `[${this.consumerId}] Retry message sent to DLQ after ${newRetryCount} retries`
            );
          }
        }
      } catch (error) {
        console.error(`[${this.consumerId}] Error processing retry message:`, error);
        channel.nack(msg, false, false);
      }
    });
  }

  /**
   * Check if error is a range-too-large error that requires splitting
   */
  private isRangeTooLargeError(error: any): boolean {
    const errorMsg = (error?.message || String(error)).toLowerCase();
    const errorCode = error?.code;
    
    // Common error patterns from RPCs
    return (
      errorMsg.includes('too many results') ||
      errorMsg.includes('query returned more than') ||
      errorMsg.includes('exceeded maximum') ||
      errorMsg.includes('range too large') ||
      errorMsg.includes('timeout') ||
      errorCode === 'UNPREDICTABLE_GAS_LIMIT' ||
      errorCode === 'TIMEOUT'
    );
  }

  /**
   * Split block range in half and re-enqueue both parts
   */
  private async splitAndRequeue(
    channel: any,
    queue: string,
    startBlock: number,
    endBlock: number,
    retryCount: number
  ): Promise<void> {
    const midBlock = Math.floor((startBlock + endBlock) / 2);
    
    const firstHalf: BlockRangeMessage = { startBlock, endBlock: midBlock };
    const secondHalf: BlockRangeMessage = { startBlock: midBlock + 1, endBlock };

    const firstMsg = Buffer.from(JSON.stringify(firstHalf));
    const secondMsg = Buffer.from(JSON.stringify(secondHalf));

    channel.sendToQueue(queue, firstMsg, {
      persistent: true,
      headers: { 'x-retry-count': retryCount, 'x-split': true },
    });

    channel.sendToQueue(queue, secondMsg, {
      persistent: true,
      headers: { 'x-retry-count': retryCount, 'x-split': true },
    });

    console.log(
      `[${this.consumerId}] Split range [${startBlock}, ${endBlock}] into ` +
      `[${startBlock}, ${midBlock}] and [${midBlock + 1}, ${endBlock}]`
    );
  }

  /**
   * Process a block range with automatic splitting on range-too-large errors
   */
  private async processBlockRange(
    message: BlockRangeMessage,
    channel?: any,
    queue?: string,
    retryCount: number = 0
  ): Promise<boolean> {
    const startTime = Date.now();
    let rpc: RPC | null = null;
    let eventsExtracted = 0;

    // Validate block range size (recommended: 5-20 blocks per message)
    const blockRange = message.endBlock - message.startBlock + 1;
    const maxRecommendedBlocks = parseInt(process.env.MAX_BLOCKS_PER_MESSAGE || '20');
    
    if (blockRange > maxRecommendedBlocks * 2) {
      console.warn(
        `[${this.consumerId}] Range too large: ${blockRange} blocks. ` +
        `Recommended max: ${maxRecommendedBlocks}. Consider reducing BLOCKS_PER_MESSAGE.`
      );
    }

    try {
      // Get available RPC
      rpc = await RPCManager.getAvailableRPC();
      if (!rpc) {
        console.error(`[${this.consumerId}] No available RPC found`);
        return false;
      }

      console.log(`[${this.consumerId}] Using RPC: ${rpc.name} (${rpc.url})`);

      // Create provider
      const provider = new ethers.JsonRpcProvider(rpc.url);

      // Fetch logs using eth_getLogs
      const logs = await provider.getLogs({
        fromBlock: message.startBlock,
        toBlock: message.endBlock,
      });

      eventsExtracted = await EventProcessor.processLogs(logs);

      const executionTime = Date.now() - startTime;
      const blocksProcessed = message.endBlock - message.startBlock + 1;
      // Calculate blocks_per_second correctly (avoid division by zero)
      const blocksPerSecond: number = executionTime > 0
        ? (blocksProcessed / (executionTime / 1000))
        : 0;

      // Record success
      await RPCManager.recordSuccess(rpc.id);

      // Save metrics
      await this.saveMetrics({
        rpcId: rpc.id,
        startBlock: message.startBlock,
        endBlock: message.endBlock,
        blocksProcessed,
        eventsExtracted,
        executionTimeMs: executionTime,
        blocksPerSecond: blocksPerSecond,
        success: true,
        errorMessage: null,
        retryCount: retryCount,
      });

      console.log(
        `[${this.consumerId}] Processed ${blocksProcessed} blocks, ` +
          `${eventsExtracted} events in ${executionTime}ms (${blocksPerSecond} blocks/s)`
      );

      return true;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const blocksProcessed = message.endBlock - message.startBlock + 1;
      const errorMessage = error.message || String(error);

      // Check if this is a range-too-large error that should trigger split
      if (this.isRangeTooLargeError(error) && channel && queue) {
        const blockRange = blocksProcessed;
        
        // Only split if range is > 1 block (avoid infinite recursion)
        if (blockRange > 1) {
          console.warn(
            `[${this.consumerId}] Range too large error for [${message.startBlock}, ${message.endBlock}]. ` +
            `Splitting automatically...`
          );

          // Record the failure but don't mark as complete failure
          if (rpc) {
            await RPCManager.recordFailure(rpc.id, `Range too large: ${errorMessage}`);
          }

          // Split and requeue - this ensures no message is lost
          await this.splitAndRequeue(channel, queue, message.startBlock, message.endBlock, retryCount);
          
          // Save metrics indicating split occurred
          await this.saveMetrics({
            rpcId: rpc?.id || null,
            startBlock: message.startBlock,
            endBlock: message.endBlock,
            blocksProcessed,
            eventsExtracted: 0,
            executionTimeMs: executionTime,
            blocksPerSecond: 0,
            success: false,
            errorMessage: `SPLIT: ${errorMessage}`,
            retryCount: retryCount,
          });

          // Return true because we handled it (split and requeued)
          return true;
        }
      }

      console.error(
        `[${this.consumerId}] Error processing blocks ${message.startBlock}-${message.endBlock}:`,
        errorMessage
      );

      // Record RPC failure
      if (rpc) {
        await RPCManager.recordFailure(rpc.id, errorMessage);
      }

      // Save metrics with error
      await this.saveMetrics({
        rpcId: rpc?.id || null,
        startBlock: message.startBlock,
        endBlock: message.endBlock,
        blocksProcessed,
        eventsExtracted: 0,
        executionTimeMs: executionTime,
        blocksPerSecond: 0,
        success: false,
        errorMessage,
        retryCount: retryCount,
      });

      // Wait before retry
      const retryDelay = parseInt(process.env.RPC_RETRY_DELAY_MS || '5000');
      await this.sleep(retryDelay);

      return false;
    }
  }

  /**
   * Save consumer metrics
   */
  private async saveMetrics(metrics: {
    rpcId: number | null;
    startBlock: number;
    endBlock: number;
    blocksProcessed: number;
    eventsExtracted: number;
    executionTimeMs: number;
    blocksPerSecond: number;
    success: boolean;
    errorMessage: string | null;
    retryCount?: number;
  }): Promise<void> {
    // Calculate blocks_per_second correctly (avoid division by zero)
    const blocksPerSecond = metrics.executionTimeMs > 0
      ? (metrics.blocksProcessed / (metrics.executionTimeMs / 1000))
      : 0;

    await Database.query(
      `INSERT INTO consumer_metrics (
        consumer_id, rpc_id, start_block, end_block,
        blocks_processed, events_extracted, execution_time_ms,
        blocks_per_second, success, error_message, retry_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        this.consumerId,
        metrics.rpcId,
        metrics.startBlock,
        metrics.endBlock,
        metrics.blocksProcessed,
        metrics.eventsExtracted,
        metrics.executionTimeMs,
        blocksPerSecond,
        metrics.success,
        metrics.errorMessage,
        metrics.retryCount || 0,
      ]
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

