'use client';

import { useState } from 'react';
import { CloudWatchLog } from '@/types';
import { ChatPanel } from '@/components/ChatPanel';
import { LogViewer } from '@/components/LogViewer';
import { JsonViewer } from '@/components/JsonViewer';
import { ResizablePanels } from '@/components/ResizablePanels';
import { AwsCredentialsModal } from '@/components/AwsCredentialsModal';
import { AwsStatusBar } from '@/components/AwsStatusBar';
import { AwsStsService, AwsCredentials } from '@/lib/aws-sts-service';
import { Button } from '@/components/ui/button';
import { Key } from 'lucide-react';

export default function Home() {
  const [logs, setLogs] = useState<CloudWatchLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<CloudWatchLog | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [isAwsConnected, setIsAwsConnected] = useState(false);
  const [awsAccountId, setAwsAccountId] = useState<string>();
  const [awsError, setAwsError] = useState<string>();

  const handleCredentialsSubmit = async (credentials: AwsCredentials) => {
    try {
      setAwsError(undefined);
      const accountInfo = await AwsStsService.validateCredentials(credentials);
      setIsAwsConnected(true);
      setAwsAccountId(accountInfo.accountId);
      
      // Store credentials in localStorage for session
      if (typeof window !== 'undefined') {
        localStorage.setItem('aws_credentials', JSON.stringify(credentials));
      }
    } catch (error) {
      setIsAwsConnected(false);
      setAwsAccountId(undefined);
      setAwsError(error instanceof Error ? error.message : 'Connection failed');
      throw error;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="flex-none p-4 border-b">
        <div className="mx-auto max-w-[1800px] flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              CloudWatch AI Analyzer
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Analyze your CloudWatch logs with AI-powered insights
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCredentialsModal(true)}
            className="gap-2"
          >
            <Key className="h-4 w-4" />
            AWS Credentials
          </Button>
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

      <AwsStatusBar
        isConnected={isAwsConnected}
        accountId={awsAccountId}
        error={awsError}
        onConnect={() => setShowCredentialsModal(true)}
      />

      <AwsCredentialsModal
        open={showCredentialsModal}
        onOpenChange={setShowCredentialsModal}
        onCredentialsSubmit={handleCredentialsSubmit}
      />
    </div>
  );
}
