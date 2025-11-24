/* eslint-disable @typescript-eslint/no-explicit-any */
import { tool } from 'ai';
import { z } from 'zod';
import { CloudWatchService } from '../cloudwatch-service';

/**
 * Tool: List all available CloudWatch log groups
 * AI uses this to discover what log groups exist
 */
export const listLogGroupsTool = tool({
  description: 'List all available CloudWatch log groups. Use this when user asks about available logs.',
  inputSchema: z.object({
    action: z.enum(['list_all']).describe('Action to perform - must be "list_all"'),
  }),
  execute: async () => {
    const allGroups = await CloudWatchService.getLogGroups();
    
    return {
      success: true,
      logGroups: allGroups,
      total: allGroups.length,
      message: `Found ${allGroups.length} total log groups`,
    };
  },
});

/**
 * Tool: Search log groups by pattern
 * AI uses this to find specific log groups matching a pattern
 */
export const searchLogGroupsTool = tool({
  description: 'Search for log groups matching a specific pattern. Use this when user mentions specific keywords like "tennis", "nginx", "application".',
  inputSchema: z.object({
    pattern: z.string().describe('Pattern to search for in log group names. Examples: "tennis", "nginx", "application"'),
  }),
  execute: async ({ pattern }) => {
    const allGroups = await CloudWatchService.getLogGroups();
    
    if (pattern && pattern.length > 0) {
      const filtered = allGroups.filter(group => 
        group.toLowerCase().includes(pattern.toLowerCase())
      );
      return {
        success: true,
        logGroups: filtered,
        total: filtered.length,
        message: `Found ${filtered.length} log groups matching "${pattern}"`,
      };
    }
    
    return {
      success: true,
      logGroups: [],
      total: 0,
      message: `No log groups found matching "${pattern}"`,
    };
  },
});

/**
 * Tool: Fetch sample logs to understand structure
 * AI uses this to discover the schema/fields before querying
 */
export const fetchSampleLogsTool = tool({
  description: 'Fetch sample log entries from a specific log group to understand its structure and available fields. Always call this before executing queries to discover the schema.',
  inputSchema: z.object({
    logGroupName: z.string().describe('The exact log group name to fetch samples from'),
    limit: z.number().default(10).describe('Number of sample logs to fetch (default: 10, max: 50)'),
    timeRangeHours: z.number().default(24).describe('How many hours back to search (default: 24)'),
  }),
  execute: async ({ logGroupName, limit = 10, timeRangeHours = 24 }) => {
    const now = new Date();
    const start = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000);
    
    const logs = await CloudWatchService.queryLogs({
      logGroupName,
      timeRange: { start, end: now },
    });
    
    const samples = logs.slice(0, Math.min(limit, 50));
    
    return {
      success: true,
      logGroupName,
      sampleCount: samples.length,
      totalFound: logs.length,
      samples: samples.map(log => ({
        timestamp: log.timestamp,
        message: log.message,
        level: log.level,
        statusCode: log.statusCode,
        metadata: log.metadata,
      })),
      message: `Fetched ${samples.length} sample logs from ${logGroupName}`,
    };
  },
});

/**
 * Tool: Analyze log structure to discover schema
 * AI uses this to understand what fields are available for querying
 */
export const analyzeLogStructureTool = tool({
  description: 'Analyze sample logs to discover their structure, available fields, and data types. Use this after fetching samples to understand how to query the logs.',
  inputSchema: z.object({
    samples: z.array(z.any()).describe('Array of sample log entries to analyze'),
  }),
  execute: async ({ samples }) => {
    if (!samples || samples.length === 0) {
      return {
        success: false,
        message: 'No samples provided to analyze',
      };
    }
    
    // Discover fields across all samples
    const fieldSet = new Set<string>();
    const fieldTypes: Record<string, Set<string>> = {};
    const fieldExamples: Record<string, any> = {};
    
    samples.forEach((sample: any) => {
      const fields = extractFields(sample);
      fields.forEach(({ path, value, type }) => {
        fieldSet.add(path);
        if (!fieldTypes[path]) {
          fieldTypes[path] = new Set();
        }
        fieldTypes[path].add(type);
        if (!fieldExamples[path]) {
          fieldExamples[path] = value;
        }
      });
    });
    
    const schema = Array.from(fieldSet).map(path => ({
      field: path,
      types: Array.from(fieldTypes[path]),
      example: fieldExamples[path],
    }));
    
    return {
      success: true,
      schema,
      totalFields: schema.length,
      message: `Discovered ${schema.length} fields in log structure`,
    };
  },
});

/**
 * Tool: Execute search and aggregation queries
 * AI uses this to actually query logs with discovered schema
 */
export const executeSearchAndAggregateTool = tool({
  description: 'Execute a search query on CloudWatch logs with optional filtering and aggregation. Use this after understanding the log structure.',
  inputSchema: z.object({
    logGroupName: z.string().describe('The exact log group name to query'),
    filterPattern: z.string().default('').describe('CloudWatch filter pattern. Use empty string for no filtering. For JSON logs: "{ $.statusCode = 404 }"'),
    timeRangeHours: z.number().default(24).describe('How many hours back to search'),
    filters: z.object({
      level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']).optional(),
      statusCode: z.number().optional(),
    }).default({}).describe('Additional filters to apply'),
    aggregateBy: z.string().default('').describe('Field to aggregate by. Use empty string for no aggregation. Examples: "statusCode", "level"'),
  }),
  execute: async ({ logGroupName, filterPattern, timeRangeHours = 24, filters, aggregateBy }) => {
    const now = new Date();
    const start = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000);
    
    const logs = await CloudWatchService.queryLogs({
      logGroupName,
      query: filterPattern && filterPattern.length > 0 ? filterPattern : undefined,
      timeRange: { start, end: now },
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });
    
    const result: Record<string, unknown> = {
      success: true,
      logGroupName,
      totalLogs: logs.length,
      timeRange: { start: start.toISOString(), end: now.toISOString() },
      logs: logs.slice(0, 100), // Limit to 100 for performance
    };
    
    // Perform aggregation if requested
    if (aggregateBy && aggregateBy.length > 0 && logs.length > 0) {
      const aggregation: Record<string, number> = {};
      logs.forEach(log => {
        const value = getNestedValue(log, aggregateBy);
        const key = String(value || 'null');
        aggregation[key] = (aggregation[key] || 0) + 1;
      });
      
      result.aggregation = {
        field: aggregateBy,
        counts: aggregation,
      };
    }
    
    // Analyze status codes
    if (logs.length > 0) {
      result.statusCodes = CloudWatchService.analyzeStatusCodes(logs);
      result.errorPatterns = CloudWatchService.analyzeErrorPatterns(logs);
    }
    
    return result;
  },
});

// Helper function to extract all fields from an object recursively
function extractFields(obj: any, prefix = ''): Array<{ path: string; value: any; type: string }> {
  const fields: Array<{ path: string; value: any; type: string }> = [];
  
  if (obj === null || obj === undefined) {
    return fields;
  }
  
  if (typeof obj !== 'object') {
    return [{
      path: prefix,
      value: obj,
      type: typeof obj,
    }];
  }
  
  Object.entries(obj).forEach(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    
    if (value === null) {
      fields.push({ path, value: null, type: 'null' });
    } else if (Array.isArray(value)) {
      fields.push({ path, value, type: 'array' });
      if (value.length > 0) {
        fields.push(...extractFields(value[0], `${path}[0]`));
      }
    } else if (typeof value === 'object') {
      fields.push({ path, value, type: 'object' });
      fields.push(...extractFields(value, path));
    } else {
      fields.push({ path, value, type: typeof value });
    }
  });
  
  return fields;
}

// Helper function to get nested value from object
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined;
    return current[key];
  }, obj);
}

export const cloudwatchTools = {
  listLogGroups: listLogGroupsTool,
  searchLogGroups: searchLogGroupsTool,
  fetchSampleLogs: fetchSampleLogsTool,
  analyzeLogStructure: analyzeLogStructureTool,
  executeSearchAndAggregate: executeSearchAndAggregateTool,
};
