import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * PostgreSQL connection pool
 */
export class Database {
  private static pool: Pool;

  static getPool(): Pool {
    if (!this.pool) {
      this.pool = new Pool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'ethereum_events',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    }
    return this.pool;
  }

  static async query(text: string, params?: any[]): Promise<any> {
    return this.getPool().query(text, params);
  }

  static async getClient(): Promise<PoolClient> {
    return this.getPool().connect();
  }

  static async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

