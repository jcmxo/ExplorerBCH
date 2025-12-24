import { Request, Response } from 'express';
import { db } from '../db';

/**
 * GET /rpcs
 * Returns all registered RPCs ordered by created_at DESC
 */
export const getRpcs = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.query(`
      SELECT id, name, url
      FROM rpcs
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching RPCs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

interface CreateRpcBody {
  name: string;
  url: string;
}

/**
 * POST /rpcs
 * Creates a new RPC endpoint
 */
export const postRpcs = async (req: Request<{}, {}, CreateRpcBody>, res: Response): Promise<void> => {
  const { name, url } = req.body;

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'name is required and must be a non-empty string' });
    return;
  }

  if (!url || typeof url !== 'string' || url.trim() === '') {
    res.status(400).json({ error: 'url is required and must be a non-empty string' });
    return;
  }

  // Validate URL format - must start with http:// or https://
  const trimmedUrl = url.trim();
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    res.status(400).json({ error: 'url must start with http:// or https://' });
    return;
  }

  try {
    const result = await db.query(
      `INSERT INTO rpcs (name, url)
       VALUES ($1, $2)
       RETURNING id, name, url`,
      [name.trim(), trimmedUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating RPC:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

