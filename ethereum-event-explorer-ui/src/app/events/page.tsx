'use client';

import { useState, useEffect } from 'react';
import { useEvents } from '../../hooks/useEvents';
import EventsTable from '../../components/EventsTable';
import Loading from '../../components/Loading';
import ErrorState from '../../components/ErrorState';

export default function EventsPage() {
  const { data, loading, error, updateFilters, refetch, nextPage, prevPage } =
    useEvents();

  const [localFilters, setLocalFilters] = useState({
    contractAddress: '',
    eventName: '',
    startBlock: '',
    endBlock: '',
  });

  useEffect(() => {
    const newFilters: Record<string, string | number> = {
      page: 1,
      pageSize: 20,
    };

    if (localFilters.contractAddress.trim()) {
      newFilters.contractAddress = localFilters.contractAddress.trim();
    }
    if (localFilters.eventName.trim()) {
      newFilters.eventName = localFilters.eventName.trim();
    }
    if (localFilters.startBlock) {
      const start = parseInt(localFilters.startBlock, 10);
      if (!isNaN(start)) {
        newFilters.startBlock = start;
      }
    }
    if (localFilters.endBlock) {
      const end = parseInt(localFilters.endBlock, 10);
      if (!isNaN(end)) {
        newFilters.endBlock = end;
      }
    }

    updateFilters(newFilters);
  }, [localFilters, updateFilters]);

  const handleFilterChange = (field: string, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setLocalFilters({
      contractAddress: '',
      eventName: '',
      startBlock: '',
      endBlock: '',
    });
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

  const events = data?.events || [];
  const total = data?.total || 0;
  const page = data?.page || 1;
  const pageSize = data?.pageSize || 20;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Explorador de Eventos
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {total.toLocaleString()} eventos encontrados
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Filtros</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Contrato
              </label>
              <input
                type="text"
                value={localFilters.contractAddress}
                onChange={(e) =>
                  handleFilterChange('contractAddress', e.target.value)
                }
                placeholder="0x..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nombre de Evento
              </label>
              <input
                type="text"
                value={localFilters.eventName}
                onChange={(e) => handleFilterChange('eventName', e.target.value)}
                placeholder="Transfer, Approval..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bloque Inicial
              </label>
              <input
                type="number"
                value={localFilters.startBlock}
                onChange={(e) =>
                  handleFilterChange('startBlock', e.target.value)
                }
                placeholder="18000000"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bloque Final
              </label>
              <input
                type="number"
                value={localFilters.endBlock}
                onChange={(e) => handleFilterChange('endBlock', e.target.value)}
                placeholder="18000100"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleClearFilters}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Events Table */}
        <div className="mb-6">
          <EventsTable events={events} loading={loading} />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between rounded-lg border bg-white px-6 py-4">
            <div className="text-sm text-gray-700">
              Mostrando {((page - 1) * pageSize + 1).toLocaleString()} -{' '}
              {Math.min(page * pageSize, total).toLocaleString()} de{' '}
              {total.toLocaleString()} eventos
            </div>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={page <= 1 || loading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <div className="flex items-center px-4 text-sm text-gray-700">
                Página {page} de {totalPages}
              </div>
              <button
                onClick={nextPage}
                disabled={page >= totalPages || loading}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

