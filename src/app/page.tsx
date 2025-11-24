'use client';

import { useState } from 'react';
import { CloudWatchLog } from '@/types';
import { ChatPanel } from '@/components/ChatPanel';
import { LogViewer } from '@/components/LogViewer';
import { JsonViewer } from '@/components/JsonViewer';
import { ResizablePanels } from '@/components/ResizablePanels';

export default function Home() {
  const [logs, setLogs] = useState<CloudWatchLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<CloudWatchLog | null>(null);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="flex-none p-4 border-b">
        <div className="mx-auto max-w-[1800px]">
          <h1 className="text-3xl font-bold text-primary">
            CloudWatch AI Analyzer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze your CloudWatch logs with AI-powered insights
          </p>
        </div>
      </header>

      <div className="flex-1 p-4 overflow-hidden">
        <div className="mx-auto max-w-[1800px] h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Left side - Chat */}
            <div className="flex flex-col h-full overflow-hidden">
              <ChatPanel onLogsReceived={setLogs} />
            </div>

            {/* Right side - Logs and JSON viewer */}
            <div className="flex flex-col h-full overflow-hidden">
              <ResizablePanels
                topPanel={
                  <LogViewer
                    logs={logs}
                    onSelectLog={setSelectedLog}
                    selectedLogId={selectedLog?.id}
                  />
                }
                bottomPanel={
                  <JsonViewer
                    data={selectedLog}
                    title={selectedLog ? `Log Entry: ${selectedLog.id}` : 'JSON Data'}
                  />
                }
                defaultTopHeight={60}
                minTopHeight={30}
                minBottomHeight={20}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
