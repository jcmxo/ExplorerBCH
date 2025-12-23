import { Request, Response } from 'express';

/**
 * GET /health
 * Health check endpoint
 */
export const getHealth = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'ok',
    service: 'ethereum-event-explorer-api',
    timestamp: new Date().toISOString(),
  });
};

