import * as amqp from 'amqplib';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * RabbitMQ connection manager
 */
export class RabbitMQ {
  private static connection: amqp.Connection | null = null;
  private static channel: amqp.Channel | null = null;

  static async connect(): Promise<amqp.Channel> {
    if (this.channel) {
      return this.channel;
    }

    const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    this.connection = await amqp.connect(url) as unknown as amqp.Connection;
    this.channel = await (this.connection as any).createChannel();

    // Declare queues
    const mainQueue = process.env.RABBITMQ_QUEUE || 'ethereum_blocks_queue';
    const retryQueue = process.env.RABBITMQ_RETRY_QUEUE || 'ethereum_blocks_retry';
    const dlq = process.env.RABBITMQ_DLQ || 'ethereum_blocks_dlq';

    if (!this.channel) {
      throw new Error('Failed to create RabbitMQ channel');
    }

    await this.channel.assertQueue(mainQueue, { durable: true });
    await this.channel.assertQueue(retryQueue, { durable: true });
    await this.channel.assertQueue(dlq, { durable: true });

    return this.channel;
  }

  static getChannel(): amqp.Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized. Call connect() first.');
    }
    return this.channel;
  }

  static async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
    }
    if (this.connection) {
      await (this.connection as any).close();
      this.connection = null;
    }
  }

  static async purgeQueue(queueName: string): Promise<void> {
    const channel = this.getChannel();
    await channel.purgeQueue(queueName);
  }
}

