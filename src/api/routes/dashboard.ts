import { Request, Response } from 'express';
import { db } from '../db';

/**
 * GET /dashboard
 * Returns general metrics about the system
 */
export const getDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Total blocks processed
    const blocksResult = await db.query(`
      SELECT 
        SUM(blocks_processed) as total_blocks
      FROM consumer_metrics
      WHERE success = true
    `);
    const blocksProcessed = parseInt(blocksResult.rows[0]?.total_blocks || '0', 10);

    // Total events extracted
    const eventsResult = await db.query(`
      SELECT COUNT(*) as total_events
      FROM events
    `);
    const eventsExtracted = parseInt(eventsResult.rows[0]?.total_events || '0', 10);

    // Average throughput (blocks_per_second)
    const throughputResult = await db.query(`
      SELECT 
        AVG(blocks_per_second) as avg_throughput
      FROM consumer_metrics
      WHERE success = true 
        AND blocks_per_second IS NOT NULL
    `);
    const avgBlocksPerSecond = parseFloat(throughputResult.rows[0]?.avg_throughput || '0');

    // Success rate
    const successRateResult = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE success = true) as successful,
        COUNT(*) as total
      FROM consumer_metrics
    `);
    const successful = parseInt(successRateResult.rows[0]?.successful || '0', 10);
    const total = parseInt(successRateResult.rows[0]?.total || '0', 10);
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    // Active consumers (last 5 minutes)
    const activeConsumersResult = await db.query(`
      SELECT COUNT(DISTINCT consumer_id) as active_consumers
      FROM consumer_metrics
      WHERE created_at > NOW() - INTERVAL '5 minutes'
    `);
    const activeConsumers = parseInt(activeConsumersResult.rows[0]?.active_consumers || '0', 10);

    res.json({
      blocksProcessed,
      eventsExtracted,
      avgBlocksPerSecond: parseFloat(avgBlocksPerSecond.toFixed(2)),
      successRate: parseFloat(successRate.toFixed(2)),
      activeConsumers,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

