import { RabbitMQ } from '../config/rabbitmq';

export interface BlockRangeMessage {
  startBlock: number;
  endBlock: number;
}

/**
 * Producer that divides block ranges into chunks and sends to RabbitMQ
 */
export class Producer {
  private startBlock: number;
  private endBlock: number;
  private blocksPerMessage: number;

  constructor(startBlock: number, endBlock: number, blocksPerMessage: number = 10) {
    this.startBlock = startBlock;
    this.endBlock = endBlock;
    this.blocksPerMessage = blocksPerMessage;
  }

  /**
   * Generate block range chunks
   */
  private generateChunks(): BlockRangeMessage[] {
    const chunks: BlockRangeMessage[] = [];
    let current = this.startBlock;

    while (current <= this.endBlock) {
      const end = Math.min(current + this.blocksPerMessage - 1, this.endBlock);
      chunks.push({
        startBlock: current,
        endBlock: end,
      });
      current = end + 1;
    }

    return chunks;
  }

  /**
   * Send all chunks to RabbitMQ
   * @param dryRun If true, only calculate and print messages without sending to RabbitMQ
   */
  async produce(dryRun: boolean = false): Promise<number> {
    const chunks = this.generateChunks();
    
    if (dryRun) {
      console.log(
        `[DRY_RUN] Would produce ${chunks.length} messages for blocks ${this.startBlock} to ${this.endBlock}`
      );
      // Print first few chunks as example
      const previewCount = Math.min(5, chunks.length);
      console.log(`[DRY_RUN] Preview of first ${previewCount} chunks:`);
      for (let i = 0; i < previewCount; i++) {
        console.log(`[DRY_RUN]   Chunk ${i + 1}: blocks ${chunks[i].startBlock} to ${chunks[i].endBlock}`);
      }
      if (chunks.length > previewCount) {
        console.log(`[DRY_RUN]   ... and ${chunks.length - previewCount} more chunks`);
      }
      console.log(`[DRY_RUN] Total: ${chunks.length} messages would be sent`);
      return chunks.length;
    }

    const channel = await RabbitMQ.connect();
    const queue = process.env.RABBITMQ_QUEUE || 'ethereum_blocks_queue';

    console.log(
      `Producing ${chunks.length} messages for blocks ${this.startBlock} to ${this.endBlock}`
    );

    let sent = 0;
    for (const chunk of chunks) {
      const message = Buffer.from(JSON.stringify(chunk));
      channel.sendToQueue(queue, message, { persistent: true });
      sent++;
      
      if (sent % 100 === 0) {
        console.log(`Sent ${sent}/${chunks.length} messages...`);
      }
    }

    console.log(`Successfully sent ${sent} messages to queue ${queue}`);
    return sent;
  }
}

