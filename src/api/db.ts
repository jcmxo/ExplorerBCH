import { Database } from '../config/database';

/**
 * Database connection for API
 * Reuses the existing Database pool
 */
export const db = Database;

