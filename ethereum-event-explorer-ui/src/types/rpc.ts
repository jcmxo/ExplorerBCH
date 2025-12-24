export type RpcStatus = 'active' | 'inactive' | 'error';

export interface Rpc {
  id: number;
  name: string;
  url: string;
  status: RpcStatus;
  lastBlock: number | null;
  failCount?: number;
  lastError?: string | null;
  lastUsedAt?: string | null;
  createdAt?: string;
}

export interface RpcStats {
  active: number;
  inUse: number;
  total: number;
}

export interface RpcListResponse {
  rpcs: Rpc[];
  stats: RpcStats;
}

export interface CreateRpcRequest {
  name: string;
  url: string;
}

export interface UpdateRpcRequest {
  name?: string;
  url?: string;
}

