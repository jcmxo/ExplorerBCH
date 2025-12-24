'use client';

import { useState, useEffect, useCallback } from 'react';
import { rpcsApi } from '../services/api';
import type { Rpc, RpcListResponse, CreateRpcRequest, UpdateRpcRequest } from '../types/rpc';

interface UseRpcsOptions {
  refetchInterval?: number;
}

export function useRpcs(options?: UseRpcsOptions) {
  const [data, setData] = useState<RpcListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await rpcsApi.getAll();
      
      // Backend returns array [{id, name, url}, ...] but we need RpcListResponse format
      // Transform array to RpcListResponse format
      const rpcsArray = Array.isArray(result) ? result : (result as RpcListResponse).rpcs || [];
      
      // Map to Rpc format with default values for missing fields
      const rpcs: Rpc[] = rpcsArray.map((rpc: any) => ({
        id: rpc.id,
        name: rpc.name,
        url: rpc.url,
        status: rpc.status || 'inactive' as const,
        lastBlock: rpc.lastBlock ?? null,
        failCount: rpc.failCount,
        lastError: rpc.lastError ?? null,
        lastUsedAt: rpc.lastUsedAt ?? null,
        createdAt: rpc.createdAt ?? rpc.created_at ?? null,
      }));
      
      // Calculate stats
      const stats = {
        total: rpcs.length,
        active: rpcs.filter(r => r.status === 'active').length,
        inUse: rpcs.filter(r => r.status === 'active').length, // Assuming active = in use for now
      };
      
      const transformedData: RpcListResponse = {
        rpcs,
        stats,
      };
      
      console.log('[useRpcs] fetchData - Response from API:', result);
      console.log('[useRpcs] fetchData - Transformed data:', transformedData);
      console.log('[useRpcs] fetchData - RPCs count:', rpcs.length);
      
      setData(transformedData);
    } catch (err) {
      console.error('[useRpcs] fetchData - Error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (options?.refetchInterval) {
      const interval = setInterval(fetchData, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, options?.refetchInterval]);

  const createRpc = useCallback(async (rpcData: CreateRpcRequest) => {
    try {
      console.log('[useRpcs] createRpc - Creating RPC:', rpcData);
      const createdRpc = await rpcsApi.create(rpcData);
      console.log('[useRpcs] createRpc - Response from POST:', createdRpc);
      
      // Immediately refetch to get updated list
      console.log('[useRpcs] createRpc - Refetching RPCs list...');
      await fetchData();
      
      // Log state after update
      console.log('[useRpcs] createRpc - State after fetchData (will be logged in fetchData)');
    } catch (err) {
      console.error('[useRpcs] createRpc - Error:', err);
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, [fetchData]);

  const updateRpc = useCallback(async (id: number, rpcData: UpdateRpcRequest) => {
    try {
      await rpcsApi.update(id, rpcData);
      await fetchData();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, [fetchData]);

  const deleteRpc = useCallback(async (id: number) => {
    try {
      await rpcsApi.delete(id);
      await fetchData();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, [fetchData]);

  const activateRpc = useCallback(async (id: number) => {
    try {
      await rpcsApi.activate(id);
      await fetchData();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, [fetchData]);

  const deactivateRpc = useCallback(async (id: number) => {
    try {
      await rpcsApi.deactivate(id);
      await fetchData();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Unknown error');
    }
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    createRpc,
    updateRpc,
    deleteRpc,
    activateRpc,
    deactivateRpc,
  };
}

