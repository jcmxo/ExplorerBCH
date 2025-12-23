import { Request, Response } from 'express';
import { db } from '../db';

/**
 * GET /rpcs
 * Returns all registered RPCs ordered by id ASC
 */
export const getRpcs = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        name,
        url,
        active,
        fail_count,
        last_used_at
      FROM rpcs
      ORDER BY id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching RPCs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

