import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { cloudwatchTools } from './tools/cloudwatch-tools';
import { config } from './config';

/**
 * AI Service V2 - Tool Calling Architecture
 * Uses Vercel AI SDK v5 with tool calling for dynamic, AI-driven workflows
 */
export class AIServiceV2 {
  /**
   * Analyze user query using AI tool calling
   * AI decides which tools to use and when (schema discovery, querying, etc.)
   */
  static async analyzeQueryWithTools(query: string) {
    const result = streamText({
      model: openai(config.openai.model),
      messages: [
        {
          role: 'system',
          content: `You are an expert CloudWatch log analyst with access to tools for querying and analyzing AWS CloudWatch logs.

**WORKFLOW - Follow these steps:**

1. **Discovery Phase**
   - Use listLogGroups to find relevant log groups
   - If user mentions patterns ("tennis", "nginx", "application"), use them
   - Explain what you found

2. **Schema Discovery Phase** (CRITICAL)
   - Use fetchSampleLogs to get 5-10 samples
   - Use analyzeLogStructure to understand fields
   - Explain the discovered structure

3. **Query Execution Phase**
   - Use executeSearchAndAggregate with discovered schema
   - Apply filters based on discovered fields
   - Use aggregateBy for counts/grouping

**RULES:**
- ALWAYS discover schema before querying
- Use partial matching for log group names
- Think out loud - stream your reasoning
- Provide insights, not just data
- Handle empty results gracefully

**FIELD DISCOVERY:**
- JSON logs: Use JSONPath ("{ $.statusCode = 404 }")
- Look for: level, statusCode, requestId, metadata
- Explain available fields before querying`,
        },
        {
          role: 'user',
          content: query,
        },
      ],
      tools: cloudwatchTools,
      temperature: config.openai.temperature,
    });

    return result;
  }
}
