/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { cloudwatchTools } from '../../src/lib/tools/cloudwatch-tools';
import { config } from '../../src/lib/config';

async function testToolCalling() {
  console.log('🧪 Testing Tool Calling E2E Flow...\n');

  // Validate config
  const errors = config.validate();
  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.log('✅ Configuration valid');
  console.log(`  - AWS Region: ${config.aws.region}`);
  console.log(`  - OpenAI Model: ${config.openai.model}`);
  console.log('');

  try {
    console.log('🤖 Test Query: "find log groups related to tennis"');
    console.log('');

    const result = streamText({
      model: openai(config.openai.model),
      messages: [
        {
          role: 'system',
          content: `You are a CloudWatch log analyst. Use tools to answer questions about logs.
          
WORKFLOW:
1. Use listLogGroups or searchLogGroups to find log groups
2. Use fetchSampleLogs to get samples
3. Use analyzeLogStructure to understand fields
4. Use executeSearchAndAggregate to query logs`,
        },
        {
          role: 'user',
          content: 'find log groups related to tennis',
        },
      ],
      tools: cloudwatchTools,
      temperature: config.openai.temperature,
    });

    console.log('📊 Streaming Results:\n');
    
    let textContent = '';
    const toolCallCount = 0;
    const toolResultCount = 0;

    // Stream the text
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
      textContent += chunk;
    }

    console.log('\n');

    // Wait for completion and get full result
    const fullResult = await result;

    console.log('\n📈 Stream Complete!\n');
    console.log(`📝 Final Text Length: ${textContent.length} characters`);
    console.log(`🔧 Tool Calls: ${fullResult.toolCalls?.length || 0}`);
    console.log(`✅ Tool Results: ${fullResult.toolResults?.length || 0}`);
    console.log(`🏁 Finish Reason: ${fullResult.finishReason}`);
    console.log(`💰 Token Usage: ${JSON.stringify(fullResult.usage)}`);

    if (fullResult.toolCalls && fullResult.toolCalls.length > 0) {
      console.log('\n🛠️ Tool Calls Made:');
      fullResult.toolCalls.forEach((call, i) => {
        console.log(`  ${i + 1}. ${call.toolName}`);
        console.log(`     Args: ${JSON.stringify(call.args)}`);
      });
    }

    if (fullResult.toolResults && fullResult.toolResults.length > 0) {
      console.log('\n📦 Tool Results:');
      fullResult.toolResults.forEach((result, i) => {
        const output = 'output' in result ? result.output : 'N/A';
        console.log(`  ${i + 1}. ${result.toolName}`);
        if (typeof output === 'object' && output !== null) {
          console.log(`     Output: ${JSON.stringify(output).slice(0, 200)}...`);
        } else {
          console.log(`     Output: ${output}`);
        }
      });
    }

    console.log('\n✅ Tool Calling E2E Test Complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Failed:');
    console.error(error);
    if (error instanceof Error && 'cause' in error) {
      console.error('\nCause:', error.cause);
    }
    if (error instanceof Error && 'responseBody' in error) {
      console.error('\nResponse Body:', (error as any).responseBody);
    }
    process.exit(1);
  }
}

testToolCalling();
