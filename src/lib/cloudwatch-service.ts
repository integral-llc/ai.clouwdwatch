import { CloudWatchLogsClient, FilterLogEventsCommand, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchLog } from '@/types';
import { config } from './config';
import { logger } from './logger';

const cloudWatchClient = new CloudWatchLogsClient({
  region: config.aws.region,
  credentials: config.isAWSConfigured() ? {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  } : undefined,
});

export class CloudWatchService {

  static async queryLogs(params: {
    query?: string;
    timeRange?: { start: Date; end: Date };
    filters?: Record<string, unknown>;
    logGroupName?: string;
  }): Promise<CloudWatchLog[]> {
    if (!cloudWatchClient) {
      throw new Error('CloudWatch client not initialized');
    }

    const logGroupName = params.logGroupName || config.aws.logGroupName;
    if (!logGroupName) {
      throw new Error('Log group name not specified. Set AWS_LOG_GROUP_NAME env variable or pass logGroupName');
    }

    const now = Date.now();
    const defaultTimeRange = config.cloudWatch.defaultTimeRangeHours * 60 * 60 * 1000;
    const startTime = params.timeRange?.start.getTime() || now - defaultTimeRange;
    const endTime = params.timeRange?.end.getTime() || now;

    // Build filter pattern
    let filterPattern = '';
    if (params.query) {
      filterPattern = params.query;
    }

    try {
      const command = new FilterLogEventsCommand({
        logGroupName,
        startTime,
        endTime,
        filterPattern: filterPattern || undefined,
        limit: config.cloudWatch.maxResults,
      });

      const response = await cloudWatchClient.send(command);
      const logs: CloudWatchLog[] = [];

      if (response.events) {
        for (const event of response.events) {
          if (!event.message || !event.timestamp) continue;

          // Parse log message and extract metadata
          const log: CloudWatchLog = this.parseCloudWatchEvent(event, logGroupName);
          
          // Apply additional filters
          if (params.filters?.level && log.level !== params.filters.level) {
            continue;
          }
          if (params.filters?.statusCode && log.statusCode !== params.filters.statusCode) {
            continue;
          }

          logs.push(log);
        }
      }

      return logs;
    } catch (error) {
      logger.error('Error querying CloudWatch', error);
      throw new Error(`Failed to query CloudWatch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static parseCloudWatchEvent(event: { message?: string; timestamp?: number; eventId?: string }, logGroupName?: string): CloudWatchLog {
    const message = event.message || '';
    const timestamp = event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString();

    // Try to parse JSON logs
    let metadata: Record<string, unknown> = { logGroupName };
    let level: CloudWatchLog['level'] = 'INFO';
    let statusCode: number | undefined;
    let requestId: string | undefined;
    let duration: number | undefined;

    try {
      // Attempt to parse as JSON
      const parsed: Record<string, unknown> = JSON.parse(message);
      metadata = { ...parsed, logGroupName };
      
      // Extract common fields
      const levelValue = (parsed.level || parsed.severity || parsed.logLevel || 'INFO');
      level = (typeof levelValue === 'string' ? levelValue.toUpperCase() : 'INFO') as CloudWatchLog['level'];
      statusCode = typeof parsed.statusCode === 'number' ? parsed.statusCode : typeof parsed.status === 'number' ? parsed.status : undefined;
      requestId = typeof parsed.requestId === 'string' ? parsed.requestId : typeof parsed.traceId === 'string' ? parsed.traceId : undefined;
      duration = typeof parsed.duration === 'number' ? parsed.duration : typeof parsed.responseTime === 'number' ? parsed.responseTime : undefined;
    } catch {
      // Not JSON, try to extract from text
      if (message.toLowerCase().includes('error')) level = 'ERROR';
      else if (message.toLowerCase().includes('warn')) level = 'WARN';
      else if (message.toLowerCase().includes('debug')) level = 'DEBUG';

      // Try to extract status code
      const statusMatch = message.match(/\b([45]\d{2})\b/);
      if (statusMatch) statusCode = parseInt(statusMatch[1]);

      // Try to extract request ID
      const reqIdMatch = message.match(/(?:request|req|trace)[_-]?id[:\s]+([a-zA-Z0-9-]+)/i);
      if (reqIdMatch) requestId = reqIdMatch[1];
    }

    return {
      id: event.eventId || `event-${Date.now()}-${Math.random()}`,
      timestamp,
      message: message.length > 500 ? message.substring(0, 500) + '...' : message,
      level,
      statusCode,
      requestId,
      duration,
      metadata,
    };
  }

  static async getLogGroups(): Promise<string[]> {
    try {
      const command = new DescribeLogGroupsCommand({
        limit: 50,
      });
      const response = await cloudWatchClient.send(command);
      return response.logGroups?.map(lg => lg.logGroupName || '').filter(Boolean) || [];
    } catch (error) {
      logger.error('Error fetching log groups', error);
      return [];
    }
  }

  static analyzeStatusCodes(logs: CloudWatchLog[]): Record<number, number> {
    const counts: Record<number, number> = {};
    logs.forEach(log => {
      if (log.statusCode) {
        counts[log.statusCode] = (counts[log.statusCode] || 0) + 1;
      }
    });
    return counts;
  }

  static analyzeErrorPatterns(logs: CloudWatchLog[]): string[] {
    const errorLogs = logs.filter(log => log.level === 'ERROR');
    const patterns = new Map<string, number>();

    errorLogs.forEach(log => {
      const pattern = log.message.split(' ').slice(0, 3).join(' ');
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    });

    return Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => `${pattern}: ${count} occurrences`);
  }
}
