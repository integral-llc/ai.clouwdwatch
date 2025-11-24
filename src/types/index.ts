export interface CloudWatchLog {
  id: string;
  timestamp: string;
  message: string;
  logGroupName?: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  statusCode?: number;
  requestId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface ChainOfThoughtStep {
  id: string;
  step: number;
  type: 'thinking' | 'analyzing' | 'querying' | 'clarifying' | 'result';
  content: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  chainOfThought?: ChainOfThoughtStep[];
  logs?: CloudWatchLog[];
}

export interface AnalysisQuery {
  query: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  logGroup?: string;
  filters?: Record<string, unknown>;
}

export interface AnalysisResult {
  summary: string;
  logs: CloudWatchLog[];
  insights: string[];
  chainOfThought: ChainOfThoughtStep[];
  clarificationNeeded?: boolean;
  clarificationQuestions?: string[];
}
