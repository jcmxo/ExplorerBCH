import { Database } from '../config/database';

export interface RPC {
  id: number;
  name: string;
  url: string;
  active: boolean;
  fail_count: number;
  last_error: string | null;
  last_used_at: Date | null;
  deactivated_at: Date | null;
}

/**
 * Manages RPC endpoints with fail tracking, auto-deactivation, and cooldown-based reactivation
 * 
 * Algorithm:
 * 1. Select RPC with lowest fail_count (prefer less failed)
 * 2. Among equal fail_counts, prefer least recently used (load balancing)
 * 3. Auto-deactivate when fail_count >= FAIL_THRESHOLD
 * 4. Auto-reactivate after COOLDOWN_MINUTES if deactivated
 */
export class RPCManager {
  private static readonly FAIL_THRESHOLD = parseInt(
    process.env.RPC_FAIL_THRESHOLD || '5'
  );
  private static readonly COOLDOWN_MINUTES = parseInt(
    process.env.RPC_COOLDOWN_MINUTES || '30'
  );

  /**
   * Get an active RPC with the lowest fail count
   * Selection algorithm: Prefer RPCs with lower fail_count, then least recently used
   */
  static async getAvailableRPC(): Promise<RPC | null> {
    // First, try to reactivate RPCs that have been in cooldown
    await this.reactivateCooldownRPCs();

    const result = await Database.query(
      `SELECT * FROM rpcs 
       WHERE active = true 
       ORDER BY fail_count ASC, last_used_at ASC NULLS FIRST 
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToRPC(result.rows[0]);
  }

  /**
   * Reactivate RPCs that have been deactivated for COOLDOWN_MINUTES
   */
  private static async reactivateCooldownRPCs(): Promise<void> {
    const result = await Database.query(
      `UPDATE rpcs 
       SET active = true, 
           fail_count = 0,
           last_error = NULL,
           deactivated_at = NULL
       WHERE active = false 
         AND deactivated_at IS NOT NULL
         AND deactivated_at < NOW() - INTERVAL '${this.COOLDOWN_MINUTES} minutes'
       RETURNING id, name`
    );

    if (result.rows.length > 0) {
      for (const row of result.rows) {
        console.log(`RPC ${row.name} (ID: ${row.id}) reactivated after cooldown period`);
      }
    }
  }

  /**
   * Record a successful RPC usage
   */
  static async recordSuccess(rpcId: number): Promise<void> {
    await Database.query(
      `UPDATE rpcs 
       SET last_used_at = CURRENT_TIMESTAMP,
           fail_count = 0,
           last_error = NULL
       WHERE id = $1`,
      [rpcId]
    );
  }

  /**
   * Record an RPC failure and deactivate if threshold exceeded
   * Sets deactivated_at timestamp for cooldown tracking
   */
  static async recordFailure(rpcId: number, error: string): Promise<void> {
    const result = await Database.query(
      `UPDATE rpcs 
       SET fail_count = fail_count + 1,
           last_error = $1,
           last_used_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING fail_count, name`,
      [error, rpcId]
    );

    const failCount = result.rows[0].fail_count;
    const rpcName = result.rows[0].name;

    if (failCount >= this.FAIL_THRESHOLD) {
      await Database.query(
        `UPDATE rpcs 
         SET active = false, 
             deactivated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [rpcId]
      );
      console.warn(
        `RPC ${rpcName} (ID: ${rpcId}) deactivated due to ${failCount} failures. ` +
        `Will auto-reactivate after ${this.COOLDOWN_MINUTES} minutes.`
      );
    }
  }

  /**
   * Add a new RPC endpoint
   */
  static async addRPC(name: string, url: string): Promise<number> {
    const result = await Database.query(
      `INSERT INTO rpcs (name, url, active, fail_count)
       VALUES ($1, $2, true, 0)
       ON CONFLICT (name) DO UPDATE SET url = $2, active = true, fail_count = 0
       RETURNING id`,
      [name, url]
    );

    return result.rows[0].id;
  }

  /**
   * Get all RPCs
   */
  static async getAllRPCs(): Promise<RPC[]> {
    const result = await Database.query('SELECT * FROM rpcs ORDER BY id');
    return result.rows.map((row: {
      id: number;
      name: string;
      url: string;
      active: boolean;
      fail_count: number;
      last_error: string | null;
      last_used_at: Date | null;
      deactivated_at?: Date | null;
    }) => this.mapRowToRPC(row));
  }

  /**
   * Reactivate an RPC manually
   */
  static async reactivateRPC(rpcId: number): Promise<void> {
    await Database.query(
      `UPDATE rpcs 
       SET active = true, 
           fail_count = 0, 
           last_error = NULL,
           deactivated_at = NULL
       WHERE id = $1`,
      [rpcId]
    );
  }

  private static mapRowToRPC(row: {
    id: number;
    name: string;
    url: string;
    active: boolean;
    fail_count: number;
    last_error: string | null;
    last_used_at: Date | null;
    deactivated_at?: Date | null;
  }): RPC {
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      active: row.active,
      fail_count: row.fail_count,
      last_error: row.last_error,
      last_used_at: row.last_used_at,
      deactivated_at: row.deactivated_at || null,
    };
  }
}

