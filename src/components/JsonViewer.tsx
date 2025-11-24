'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Maximize2 } from 'lucide-react';
import { JsonView, allExpanded, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { useState } from 'react';
import { useTheme } from 'next-themes';

interface JsonViewerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  title?: string;
}

export function JsonViewer({ data, title = 'Log Details' }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopyAll = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExpandAll = () => {
    // Already expanded by default
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <div className="flex-none px-3 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{title}</h2>
          {data?.timestamp && (
            <span className="text-xs text-muted-foreground">
              {new Date(data.timestamp).toLocaleString()}
            </span>
          )}
        </div>
        {data && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleCopyAll}
            >
              <Copy className="h-3 w-3 mr-1" />
              {copied ? 'Copied!' : 'Copy All'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleExpandAll}
            >
              <Maximize2 className="h-3 w-3 mr-1" />
              Expand All
            </Button>
          </div>
        )}
      </div>
      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-3">
          {data ? (
            <JsonView
              data={data}
              shouldExpandNode={allExpanded}
              style={theme === 'dark' ? darkStyles : defaultStyles}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No data selected</p>
              <p className="text-xs mt-2">Click on a log entry to view details</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
