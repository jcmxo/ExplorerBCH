'use client';

import { useState, useEffect } from 'react';
import { useRpcs } from '../../hooks/useRpcs';
import RpcTable from '../../components/RpcTable';
import RpcModal from '../../components/RpcModal';
import StatCard from '../../components/StatCard';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import type { Rpc, CreateRpcRequest, UpdateRpcRequest } from '../../types/rpc';

export default function RpcsPage() {
  const {
    data,
    loading,
    error,
    refetch,
    createRpc,
    updateRpc,
    deleteRpc,
    activateRpc,
    deactivateRpc,
  } = useRpcs({
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRpc, setEditingRpc] = useState<Rpc | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Log state changes for debugging
  useEffect(() => {
    const stats = data?.stats || { active: 0, inUse: 0, total: 0 };
    const rpcs = data?.rpcs || [];
    console.log('[RpcsPage] State updated - RPCs:', rpcs.length, 'Stats:', stats);
    console.log('[RpcsPage] RPCs list:', rpcs);
  }, [data]);

  const handleOpenModal = (rpc?: Rpc) => {
    setEditingRpc(rpc || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRpc(null);
  };

  const handleSave = async (rpcData: CreateRpcRequest | UpdateRpcRequest) => {
    setActionLoading(true);
    try {
      console.log('[RpcsPage] handleSave - Saving RPC:', rpcData, 'Editing:', !!editingRpc);
      if (editingRpc) {
        await updateRpc(editingRpc.id, rpcData as UpdateRpcRequest);
      } else {
        await createRpc(rpcData as CreateRpcRequest);
      }
      console.log('[RpcsPage] handleSave - Save successful, closing modal');
      handleCloseModal();
    } catch (err) {
      console.error('[RpcsPage] handleSave - Error:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  const stats = data?.stats || { active: 0, inUse: 0, total: 0 };
  const rpcs = data?.rpcs || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de RPCs</h1>
            <p className="mt-1 text-sm text-gray-500">
              {stats.active} activos · {stats.inUse} en uso · {stats.total} total
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Añadir RPC
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard
            title="RPCs Activos"
            value={stats.active}
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="green"
          />
          <StatCard
            title="En Uso"
            value={stats.inUse}
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="blue"
          />
          <StatCard
            title="Total RPCs"
            value={stats.total}
            icon={
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
            }
            color="gray"
          />
        </div>

        {/* RPCs Table */}
        <div className="mb-4">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Endpoints Disponibles
          </h2>
          <RpcTable
            rpcs={rpcs}
            onActivate={activateRpc}
            onDeactivate={deactivateRpc}
            onEdit={handleOpenModal}
            onDelete={deleteRpc}
            loading={loading}
          />
        </div>

        {/* Modal */}
        <RpcModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          rpc={editingRpc}
          loading={actionLoading}
        />
      </main>
    </div>
  );
}

