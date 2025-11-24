 
async function testAPIEndpoint() {
  console.log('🧪 Testing /api/chat endpoint directly...\n');

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'find log groups related to tennis',
      }),
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('\nStreaming Response:\n');

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      console.error('❌ No response body');
      return;
    }

    let eventCount = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('\n✅ Stream complete');
        break;
      }

      const chunk = decoder.decode(value);
      console.log('📦 Chunk received:', chunk);
      
      // Parse SSE events
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          eventCount++;
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            console.log(`  Event ${eventCount}:`, JSON.stringify(parsed, null, 2));
          } catch {
            console.log(`  Event ${eventCount} (raw):`, data);
          }
        }
      }
    }

    console.log(`\n📊 Total events received: ${eventCount}`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAPIEndpoint();
