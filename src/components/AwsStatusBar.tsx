'use client';

import { CheckCircle2, XCircle, CloudOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AwsStatusBarProps {
  isConnected: boolean;
  accountId?: string;
  error?: string;
  onConnect: () => void;
}

export function AwsStatusBar({ isConnected, accountId, error, onConnect }: AwsStatusBarProps) {
  return (
    <div className="border-t bg-muted/40 px-4 py-2 flex items-center justify-between text-xs">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground font-medium">AWS Status:</span>
        {isConnected ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-green-700 font-medium">Connected</span>
            {accountId && (
              <Badge variant="secondary" className="font-mono text-[10px]">
                Account: {accountId}
              </Badge>
            )}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-700 font-medium">Error</span>
            <span className="text-muted-foreground">{error}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CloudOff className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Not connected</span>
            <button
              onClick={onConnect}
              className="text-primary hover:underline font-medium"
            >
              Connect
            </button>
          </div>
        )}
      </div>
      <div className="text-muted-foreground">
        CloudWatch AI Analyzer v1.0.0
      </div>
    </div>
  );
}
