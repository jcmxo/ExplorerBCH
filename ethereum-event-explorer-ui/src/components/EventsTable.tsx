'use client';

import type { Event } from '../types/event';

interface EventsTableProps {
  events: Event[];
  loading?: boolean;
}

export default function EventsTable({ events, loading = false }: EventsTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
        Cargando eventos...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
        No hay eventos para mostrar
      </div>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                BLOQUE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                CONTRATO
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                EVENTO
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                TRANSACCIÓN
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                TIMESTAMP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {event.blockNumber.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span className="font-mono text-xs">{formatAddress(event.contractAddress)}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {event.eventName || (
                    <span className="font-mono text-xs text-gray-400">
                      {formatHash(event.eventSignature)}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span className="font-mono text-xs">{formatHash(event.transactionHash)}</span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatTimestamp(event.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

