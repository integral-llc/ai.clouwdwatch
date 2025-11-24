'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage, CloudWatchLog } from '@/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Bot, User as UserIcon, Trash2 } from 'lucide-react';
import { ChainOfThought } from './ChainOfThought';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPanelProps {
  onLogsReceived: (logs: CloudWatchLog[]) => void;
}

export function ChatPanel({ onLogsReceived }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        chainOfThought: [],
      };

      setMessages(prev => [...prev, assistantMessage]);

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'step') {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'assistant') {
                      const existingSteps = lastMessage.chainOfThought || [];
                      const isDuplicate = existingSteps.some(s => s.id === data.step.id);
                      if (!isDuplicate) {
                        lastMessage.chainOfThought = [...existingSteps, data.step];
                      }
                      
                      // Don't add tool results to content - they're shown in Chain of Thought
                    }
                    return newMessages;
                  });
                } else if (data.type === 'result') {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'assistant') {
                      // Only set if there's actual content
                      if (data.result.summary) {
                        lastMessage.content = String(data.result.summary);
                      }
                      lastMessage.logs = data.result.logs;

                      // Only add insights/questions if they have actual content
                      if (data.result.clarificationNeeded && Array.isArray(data.result.clarificationQuestions) && data.result.clarificationQuestions.length > 0) {
                        lastMessage.content += '\n\n**Questions:**\n' + 
                          data.result.clarificationQuestions.map((q: string) => String(q)).join('\n');
                      } else if (data.result.insights && Array.isArray(data.result.insights) && data.result.insights.length > 0) {
                        lastMessage.content += '\n\n**Insights:**\n' + 
                          data.result.insights.map((i: string) => String(i)).join('\n');
                      }
                    }
                    return newMessages;
                  });

                  if (data.result.logs && data.result.logs.length > 0) {
                    console.log('📊 Logs received:', data.result.logs.length, 'entries');
                    console.log('📋 First log:', data.result.logs[0]);
                    onLogsReceived(data.result.logs);
                  } else {
                    console.log('⚠️ No logs in result:', data.result);
                  }
                } else if (data.type === 'error') {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'assistant') {
                      lastMessage.content = `Error: ${data.error}`;
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    onLogsReceived([]);
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <div className="flex-none px-3 py-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">CloudWatch Analyzer</h2>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="h-7 px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-semibold mb-2">Welcome!</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Ask me anything about your CloudWatch logs
              </p>
              <div className="space-y-1.5 text-xs text-left max-w-md mx-auto">
                <p className="font-semibold text-xs">Try asking:</p>
                <ul className="space-y-0.5 text-muted-foreground text-xs">
                  <li>• Show me all 404 errors</li>
                  <li>• How many error status codes do I have?</li>
                  <li>• Show me logs from the last hour</li>
                  <li>• What log groups do you see?</li>
                </ul>
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map(message => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-2"
              >
                <div className="mt-0.5">
                  {message.role === 'user' ? (
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-3 w-3 text-primary" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-xs whitespace-pre-wrap leading-relaxed">{String(message.content || '')}</p>
                  </div>
                  {message.chainOfThought && message.chainOfThought.length > 0 && (
                    <div className="mt-2">
                      <ChainOfThought steps={message.chainOfThought} />
                    </div>
                  )}
                  {message.logs && message.logs.length > 0 && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {message.logs.length} logs found
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex gap-2">
              <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <Bot className="h-3 w-3 animate-pulse" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="flex-none p-2 border-t">
        <div className="flex gap-1.5">
          <Input
            placeholder="Ask about your logs..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1 h-8 text-xs"
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()} size="sm" className="h-8 px-3">
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
