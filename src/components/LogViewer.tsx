'use client';

import { useState, useMemo } from 'react';
import { CloudWatchLog } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

interface LogViewerProps {
  logs: CloudWatchLog[];
  onSelectLog: (log: CloudWatchLog) => void;
  selectedLogId?: string;
}

export function LogViewer({ logs, onSelectLog, selectedLogId }: LogViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  console.log('🔍 LogViewer rendering with', logs.length, 'logs');

  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    const query = searchQuery.toLowerCase();
    return logs.filter(
      log =>
        log.message.toLowerCase().includes(query) ||
        log.level?.toLowerCase().includes(query) ||
        log.requestId?.toLowerCase().includes(query)
    );
  }, [logs, searchQuery]);

  const columnHelper = createColumnHelper<CloudWatchLog>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('timestamp', {
        header: 'Time',
        cell: info => new Date(info.getValue()).toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3,
        }),
        size: 200,
      }),
      columnHelper.accessor('logGroupName', {
        header: 'Log Group',
        cell: info => info.getValue() || '-',
        size: 280,
      }),
      columnHelper.accessor('message', {
        header: 'Message',
        cell: info => info.getValue(),
      }),
    ],
    [columnHelper]
  );

  const table = useReactTable({
    data: filteredLogs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <div className="flex-none p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Log Entries</h2>
          <Badge variant="secondary" className="text-xs">{filteredLogs.length}</Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No logs to display</p>
            <p className="text-xs mt-2">Ask a question to query CloudWatch logs</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/50 backdrop-blur">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="text-left p-2 font-medium"
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => {
                const isSelected = row.original.id === selectedLogId;
                return (
                  <tr
                    key={row.id}
                    className={`border-b cursor-pointer hover:bg-accent/50 transition-colors ${
                      isSelected ? 'bg-accent' : ''
                    }`}
                    onClick={() => onSelectLog(row.original)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-2 truncate max-w-0">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
