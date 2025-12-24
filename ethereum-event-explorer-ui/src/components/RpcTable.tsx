'use client';

import { useState } from 'react';
import type { Rpc } from '../types/rpc';

interface RpcTableProps {
  rpcs: Rpc[];
  onActivate: (id: number) => Promise<void>;
  onDeactivate: (id: number) => Promise<void>;
  onEdit: (rpc: Rpc) => void;
  onDelete: (id: number) => Promise<void>;
  loading?: boolean;
}

export default function RpcTable({
  rpcs,
  onActivate,
  onDeactivate,
  onEdit,
  onDelete,
  loading = false,
}: RpcTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handleToggle = async (rpc: Rpc) => {
    if (togglingId) return;
    
    setTogglingId(rpc.id);
    try {
      if (rpc.status === 'active') {
        await onDeactivate(rpc.id);
      } else {
        await onActivate(rpc.id);
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este RPC?')) {
      return;
    }

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: Rpc['status']) => {
    const badges = {
      active: (
        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
          Activo
        </span>
      ),
      inactive: (
        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
          Inactivo
        </span>
      ),
      error: (
        <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
          Error
        </span>
      ),
    };
    return badges[status];
  };

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
        Cargando RPCs...
      </div>
    );
  }

  if (rpcs.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
        No hay RPCs disponibles
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                NOMBRE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ESTADO
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ÚLTIMO BLOQUE
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {rpcs.map((rpc) => (
              <tr key={rpc.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {rpc.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span className="font-mono text-xs">{rpc.url}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {getStatusBadge(rpc.status)}
                  {rpc.status === 'error' && rpc.lastError && (
                    <div className="mt-1 text-xs text-red-600">
                      {rpc.lastError}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {rpc.lastBlock !== null ? rpc.lastBlock.toLocaleString() : '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggle(rpc)}
                      disabled={togglingId === rpc.id || deletingId === rpc.id}
                      className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                        rpc.status === 'active'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } disabled:opacity-50`}
                    >
                      {togglingId === rpc.id
                        ? '...'
                        : rpc.status === 'active'
                        ? 'Desactivar'
                        : 'Activar'}
                    </button>
                    <button
                      onClick={() => onEdit(rpc)}
                      disabled={togglingId === rpc.id || deletingId === rpc.id}
                      className="rounded bg-blue-100 p-1.5 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                      title="Editar"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(rpc.id)}
                      disabled={togglingId === rpc.id || deletingId === rpc.id}
                      className="rounded bg-red-100 p-1.5 text-red-700 hover:bg-red-200 disabled:opacity-50"
                      title="Eliminar"
                    >
                      {deletingId === rpc.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-700 border-t-transparent"></div>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

