export interface Event {
  id: number;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  contractAddress: string;
  eventName: string | null;
  eventSignature: string;
  timestamp: string; // ISO timestamp
  param1?: string | null;
  param2?: string | null;
  param3?: string | null;
  // ... otros parámetros si son necesarios
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EventsFilters {
  contractAddress?: string;
  eventName?: string;
  startBlock?: number;
  endBlock?: number;
  page?: number;
  pageSize?: number;
}

