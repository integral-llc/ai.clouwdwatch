'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AwsCredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCredentialsSubmit: (credentials: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
    region: string;
  }) => Promise<void>;
}

export function AwsCredentialsModal({ open, onOpenChange, onCredentialsSubmit }: AwsCredentialsModalProps) {
  const [input, setInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const parseCredentials = (text: string) => {
    const lines = text.split('\n');
    const creds: Record<string, string> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Parse export statements: export KEY="VALUE" or export KEY=VALUE
      const exportMatch = trimmed.match(/^export\s+([A-Z_]+)="?([^"]+)"?$/);
      if (exportMatch) {
        const [, key, value] = exportMatch;
        creds[key] = value.replace(/^"|"$/g, ''); // Remove surrounding quotes
      }
    }

    return {
      accessKeyId: creds.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: creds.AWS_SECRET_ACCESS_KEY || '',
      sessionToken: creds.AWS_SESSION_TOKEN || undefined,
      region: creds.AWS_REGION || 'us-east-1',
    };
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    try {
      const credentials = parseCredentials(input);

      if (!credentials.accessKeyId || !credentials.secretAccessKey) {
        setError('Missing required credentials: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
        return;
      }

      setIsValidating(true);
      await onCredentialsSubmit(credentials);
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setInput('');
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate credentials');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setError('');
    setSuccess(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AWS Credentials</DialogTitle>
          <DialogDescription>
            Paste your AWS credentials in export format. The app will parse and validate them automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Textarea
              placeholder={`export AWS_ACCESS_KEY_ID="ASIA6RQ3WEUGUPFHXSY3"
export AWS_SECRET_ACCESS_KEY="Ccg7KFdVgYJsQVSwh5BNMBaae1GDvxyWqsETareH"
export AWS_SESSION_TOKEN="IQoJb3JpZ2luX2..."
export AWS_REGION="us-east-1"`}
              value={input}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
              className="font-mono text-sm min-h-[200px]"
              disabled={isValidating}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Credentials validated successfully!</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClear} disabled={isValidating}>
              Clear
            </Button>
            <Button onClick={handleSubmit} disabled={isValidating || !input.trim()}>
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
