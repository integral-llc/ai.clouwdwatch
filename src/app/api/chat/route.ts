import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { cloudwatchTools } from '@/lib/tools/cloudwatch-tools';
import { CloudWatchLog } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Track collected logs from tool results
    const collectedLogs: CloudWatchLog[] = [];
    let stepCounter = 0;
    const sessionId = Date.now();

    console.log('🔍 Starting generateText with tools:', Object.keys(cloudwatchTools));
    console.log('🔍 User message:', message);

    // AI generation with tool calling
    const result = await generateText({
      model: openai('gpt-4o'),
      messages: [
        {
          role: 'system',
          content: `You are a CloudWatch log analyst. Your job is to fetch and display actual log entries.

**MANDATORY: Always complete BOTH steps:**
1. Use searchLogGroups to find the log group (e.g., pattern: "tennis")
2. IMMEDIATELY use fetchSampleLogs with the FIRST log group found to get actual logs

**DO NOT stop after finding log groups. You MUST call fetchSampleLogs!**

Example for "show tennis logs":
Step 1: searchLogGroups with pattern "tennis" → finds "/aws/ec2/development/where-tennis/application"
Step 2: fetchSampleLogs with logGroupName "/aws/ec2/development/where-tennis/application" → returns actual log entries

Keep your text response brief. The logs will display in the grid.`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      tools: cloudwatchTools,
      temperature: 0,
      toolChoice: 'auto',
    });

    // Extract logs from tool results and auto-fetch if needed
    let foundLogGroups: string[] = [];
    let fetchedLogs = false;

    console.log('🔍 Processing tool results:', result.toolResults?.length || 0);

    if (result.toolResults) {
      for (const tr of result.toolResults) {
        console.log('🛠️ Tool result:', tr.toolName, 'output' in tr ? 'has output' : 'no output');
        
        if ('output' in tr) {
          const output = tr.output as { logs?: CloudWatchLog[]; samples?: CloudWatchLog[]; logGroups?: string[]; };
          console.log(`   📋 Output keys:`, Object.keys(output || {}));
          
          // Track if log groups were found
          if (tr.toolName === 'searchLogGroups' && output.logGroups) {
            foundLogGroups = output.logGroups;
            console.log(`   ✅ Found ${foundLogGroups.length} log groups:`, foundLogGroups);
          }
          
          // Get logs from executeSearchAndAggregate
          if (tr.toolName === 'executeSearchAndAggregate' && output.logs) {
            if (Array.isArray(output.logs)) {
              collectedLogs.push(...output.logs);
              fetchedLogs = true;
            }
          }
          
          // Get logs from fetchSampleLogs
          if (tr.toolName === 'fetchSampleLogs' && output.samples) {
            if (Array.isArray(output.samples)) {
              collectedLogs.push(...output.samples);
              fetchedLogs = true;
            }
          }
        }
      }
    }

    console.log(`📊 After tool processing: foundLogGroups=${foundLogGroups.length}, fetchedLogs=${fetchedLogs}, collectedLogs=${collectedLogs.length}`);

    // AUTO-FETCH: If AI found log groups but didn't fetch logs, do it ourselves
    if (foundLogGroups.length > 0 && !fetchedLogs) {
      console.log(`⚠️ AI found ${foundLogGroups.length} log groups but did not fetch logs. Trying all of them...`);
      try {
        const { CloudWatchService } = await import('@/lib/cloudwatch-service');
        const now = new Date();
        const start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours
        
        // Try each log group until we find one with logs
        for (const logGroup of foundLogGroups) {
          console.log(`🔍 Checking log group: ${logGroup}`);
          
          const logs = await CloudWatchService.queryLogs({
            logGroupName: logGroup,
            timeRange: { start, end: now },
          });
          
          console.log(`   📊 Found ${logs.length} logs`);
          
          if (logs.length > 0) {
            console.log(`   ✅ Using logs from ${logGroup}`);
            collectedLogs.push(...logs.slice(0, 100)); // Take up to 100
            break; // Stop after finding the first group with logs
          }
        }
        
        if (collectedLogs.length === 0) {
          console.log('⚠️ No logs found in any of the log groups in the last 24 hours.');
          console.log('💡 The log groups exist but appear to be empty or inactive.');
        }
        
        console.log(`✅ Auto-fetched ${collectedLogs.length} logs total`);
      } catch (error) {
        console.error('❌ Auto-fetch failed:', error);
        if (error instanceof Error) {
          console.error('❌ Error details:', error.message);
        }
      }
    }

    console.log(`📦 Final collectedLogs count: ${collectedLogs.length}`);

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        console.log('🔍 Sending result...');

        try {
          // Send tool calls as steps
          if (result.toolCalls) {
            for (const toolCall of result.toolCalls) {
              const step = {
                id: `step-${sessionId}-${stepCounter++}`,
                step: stepCounter - 1,
                type: 'tool_call' as const,
                content: `Calling tool: ${toolCall.toolName}`,
                data: { toolName: toolCall.toolName, args: toolCall.input },
                timestamp: new Date(),
              };
              
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'step', step })}\n\n`)
              );
            }
          }

          // Send tool results as steps
          if (result.toolResults) {
            for (const toolResult of result.toolResults) {
              const step = {
                id: `step-${sessionId}-${stepCounter++}`,
                step: stepCounter - 1,
                type: 'tool_result' as const,
                content: `Tool ${toolResult.toolName} completed`,
                data: { toolName: toolResult.toolName, result: 'output' in toolResult ? toolResult.output : undefined },
                timestamp: new Date(),
              };
              
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'step', step })}\n\n`)
              );
            }
          }

          // Send AI text response (or helpful message if no logs)
          let finalContent = result.text;
          
          if (collectedLogs.length === 0 && foundLogGroups.length > 0) {
            // Display log groups as "logs" in the grid
            finalContent = `Found ${foundLogGroups.length} log groups matching your query.`;
            
            console.log('💡 Converting log group names to grid items...');
            console.log('💡 Found log groups:', foundLogGroups);
            const logGroupItems: CloudWatchLog[] = foundLogGroups.map((groupName, i) => {
              console.log(`   Creating grid item ${i}: logGroupName="${groupName}"`);
              return {
                id: `loggroup-${i}`,
                timestamp: new Date().toISOString(),
                message: `Log group ${i + 1} of ${foundLogGroups.length}`,
                logGroupName: groupName,
                level: 'INFO',
                metadata: { type: 'log-group', name: groupName },
              };
            });
            console.log('💡 Created items:', JSON.stringify(logGroupItems, null, 2));
            collectedLogs.push(...logGroupItems);
            console.log('💡 collectedLogs now has:', collectedLogs.length, 'items');
          }
          
          const finalStep = {
            id: `step-${sessionId}-${stepCounter++}`,
            step: stepCounter - 1,
            type: 'result' as const,
            content: finalContent,
            timestamp: new Date(),
          };

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'step', step: finalStep })}\n\n`)
          );

          // Send final result
          console.log(`📤 Sending ${collectedLogs.length} logs to client`);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'result',
              result: {
                summary: finalContent,
                logs: collectedLogs,
                insights: [],
                chainOfThought: [],
              },
            })}\n\n`)
          );

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Stream error',
            })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
