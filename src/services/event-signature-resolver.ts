import { Database } from '../config/database';

/**
 * Resolves event signatures to human-readable names using 4byte.directory API
 * Caches results in memory and database
 */
export class EventSignatureResolver {
  private static memoryCache: Map<string, string> = new Map();
  private static readonly API_URL = 'https://www.4byte.directory/api/v1/event-signatures/';

  /**
   * Resolve event signature to name
   */
  static async resolve(signature: string): Promise<string> {
    // Check memory cache first
    if (this.memoryCache.has(signature)) {
      return this.memoryCache.get(signature)!;
    }

    // Check database cache
    const dbResult = await Database.query(
      'SELECT name FROM event_signatures WHERE signature = $1',
      [signature]
    );

    if (dbResult.rows.length > 0) {
      const name = dbResult.rows[0].name;
      this.memoryCache.set(signature, name);
      return name;
    }

    // Fetch from API (never throws - always returns Unknown on error)
    const name = await this.fetchFromAPI(signature);
    
    // Cache in database and memory (even if Unknown)
    try {
      await Database.query(
        'INSERT INTO event_signatures (signature, name) VALUES ($1, $2) ON CONFLICT (signature) DO NOTHING',
        [signature, name]
      );
    } catch (dbError) {
      // Log but don't fail - cache is optional
      console.warn(`Failed to cache signature ${signature} in DB:`, dbError);
    }
    
    this.memoryCache.set(signature, name);
    return name;
  }

  /**
   * Fetch event name from 4byte.directory API
   * IMPORTANT: Remove '0x' prefix before calling API
   */
  private static async fetchFromAPI(signature: string): Promise<string> {
    // Remove '0x' prefix if present - API expects hex without prefix
    const sigWithout0x = signature.startsWith('0x') ? signature.slice(2) : signature;
    const url = `${this.API_URL}?hex_signature=${sigWithout0x}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        // Don't throw, return Unknown to avoid breaking consumer flow
        console.warn(`4byte.directory API returned ${response.status} for signature ${signature}`);
        return 'Unknown';
      }

      const data: any = await response.json();
      
      // Handle null/undefined responses gracefully
      if (!data || !data.results || !Array.isArray(data.results) || data.results.length === 0) {
        return 'Unknown';
      }

      // Return the first result's text_signature
      const textSignature = data.results[0]?.text_signature;
      if (!textSignature || typeof textSignature !== 'string') {
        return 'Unknown';
      }

      // Extract event name (e.g., "Transfer(address,address,uint256)" -> "Transfer")
      const match = textSignature.match(/^(\w+)\s*\(/);
      return match ? match[1] : textSignature;
    } catch (error) {
      // Never throw - always return Unknown to prevent breaking consumer
      console.warn(`Error fetching from 4byte.directory for ${signature}:`, error);
      return 'Unknown';
    }
  }

  /**
   * Preload common event signatures
   */
  static async preloadCommonSignatures(): Promise<void> {
    const commonSignatures = [
      { sig: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', name: 'Transfer' },
      { sig: '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0', name: 'Approval' },
      { sig: '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31', name: 'ApprovalForAll' },
    ];

    for (const { sig, name } of commonSignatures) {
      this.memoryCache.set(sig, name);
      await Database.query(
        'INSERT INTO event_signatures (signature, name) VALUES ($1, $2) ON CONFLICT (signature) DO NOTHING',
        [sig, name]
      );
    }
  }

  /**
   * Clear memory cache
   */
  static clearCache(): void {
    this.memoryCache.clear();
  }
}

