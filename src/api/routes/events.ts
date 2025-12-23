import { Request, Response } from 'express';
import { db } from '../db';

/**
 * GET /events
 * Returns paginated events with optional filters
 */
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const pageSize = parseInt(req.query.pageSize as string || '20', 10);
    const contractAddress = req.query.contract_address as string;
    const eventName = req.query.event_name as string;
    const fromBlock = req.query.from_block as string;
    const toBlock = req.query.to_block as string;

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (contractAddress) {
      conditions.push(`contract_address = $${paramIndex}`);
      params.push(contractAddress);
      paramIndex++;
    }

    if (eventName) {
      conditions.push(`event_name = $${paramIndex}`);
      params.push(eventName);
      paramIndex++;
    }

    if (fromBlock) {
      conditions.push(`block_number >= $${paramIndex}`);
      params.push(parseInt(fromBlock, 10));
      paramIndex++;
    }

    if (toBlock) {
      conditions.push(`block_number <= $${paramIndex}`);
      params.push(parseInt(toBlock, 10));
      paramIndex++;
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Get total count (use a copy of params to avoid mutation)
    const countParams = [...params];
    const countResult = await db.query(`
      SELECT COUNT(*) as total
      FROM events
      ${whereClause}
    `, countParams);
    const total = parseInt(countResult.rows[0]?.total || '0', 10);

    // Get paginated events
    const offset = (page - 1) * pageSize;
    params.push(pageSize, offset);

    const eventsResult = await db.query(`
      SELECT 
        id,
        block_number,
        transaction_hash,
        contract_address,
        event_name
      FROM events
      ${whereClause}
      ORDER BY block_number DESC, id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, params);

    res.json({
      page,
      pageSize,
      total,
      events: eventsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

