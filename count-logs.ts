import { CloudWatchLogsClient, FilterLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { config } from './src/lib/config';

async function countLogEntries(logGroupName: string) {
  console.log(`\n🔍 Counting log entries in: ${logGroupName}\n`);

  const client = new CloudWatchLogsClient({
    region: config.aws.region,
    credentials: config.isAWSConfigured() ? {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    } : undefined,
  });

  // Query logs for the last 7 days by default
  const now = Date.now();
  const oneDayAgo = now - (7 * 24 * 60 * 60 * 1000);

  let totalCount = 0;
  let nextToken: string | undefined = undefined;
  let pageCount = 0;

  try {
    do {
      pageCount++;
      console.log(`📄 Fetching page ${pageCount}...`);

      const command: FilterLogEventsCommand = new FilterLogEventsCommand({
        logGroupName,
        startTime: oneDayAgo,
        endTime: now,
        nextToken,
        limit: 10000, // Max per request
      });

      const response = await client.send(command);
      const eventsInPage = response.events?.length || 0;
      totalCount += eventsInPage;

      console.log(`   Found ${eventsInPage} entries in this page (Total so far: ${totalCount})`);

      nextToken = response.nextToken as string | undefined;
    } while (nextToken);

    console.log(`\n✅ Total log entries: ${totalCount.toLocaleString()}`);
    console.log(`📅 Time range: Last 7 days\n`);

    return totalCount;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}`);
      
      if (error.message.includes('does not exist')) {
        console.error(`\n💡 The log group "${logGroupName}" does not exist.`);
        console.error('   Try listing available log groups first.\n');
      }
    } else {
      console.error('❌ Unknown error:', error);
    }
    process.exit(1);
  }
}

// Get log group name from command line or use default
const logGroupName = process.argv[2] || '/aws/ec2/development/where-tennis/nginx/access';

countLogEntries(logGroupName).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
