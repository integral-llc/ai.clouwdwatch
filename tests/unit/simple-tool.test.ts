/* eslint-disable @typescript-eslint/no-explicit-any */
import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { config } from './src/lib/config';

async function testSimpleTool() {
  console.log('🧪 Testing Simple Tool Definition...\n');

  // Test 1: Simple tool with required parameter
  console.log('Test 1: Simple tool with required parameter');
  try {
    const result1 = await generateText({
      model: openai(config.openai.model),
      tools: {
        getWeather: tool({
          description: 'Get weather for a location',
          inputSchema: z.object({
            location: z.string(),
          }),
          execute: async ({ location }) => {
            console.log(`  ✅ Tool executed with location: ${location}`);
            return { temperature: 72, location };
          },
        }),
      },
      prompt: 'What is the weather in San Francisco?',
    });

    console.log('  Result:', result1.text);
    console.log('  Tool Calls:', result1.toolCalls.length);
    console.log('  Tool Results:', result1.toolResults.length);
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
  }

  console.log('\nTest 2: Tool with default parameter (like our listLogGroups)');
  try {
    const result2 = await generateText({
      model: openai(config.openai.model),
      tools: {
        listItems: tool({
          description: 'List all items',
          inputSchema: z.object({
            action: z.enum(['list_all']),
          }),
          execute: async ({ action }) => {
            console.log(`  ✅ Tool executed with action: ${action}`);
            return { items: ['item1', 'item2', 'item3'] };
          },
        }),
      },
      prompt: 'List all items',
    });

    console.log('  Result:', result2.text);
    console.log('  Tool Calls:', result2.toolCalls.length);
    console.log('  Tool Results:', result2.toolResults.length);
  } catch (error) {
    console.error('  ❌ Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && 'responseBody' in error) {
      console.error('  Response:', (error as any).responseBody);
    }
  }

  console.log('\n✅ Test Complete');
}

testSimpleTool();
