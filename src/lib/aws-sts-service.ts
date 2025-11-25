import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
}

export interface AwsAccountInfo {
  accountId: string;
  arn: string;
  userId: string;
}

export class AwsStsService {
  static async validateCredentials(credentials: AwsCredentials): Promise<AwsAccountInfo> {
    const stsClient = new STSClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
      },
    });

    try {
      const command = new GetCallerIdentityCommand({});
      const response = await stsClient.send(command);

      if (!response.Account || !response.Arn || !response.UserId) {
        throw new Error('Invalid response from AWS STS');
      }

      return {
        accountId: response.Account,
        arn: response.Arn,
        userId: response.UserId,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`AWS authentication failed: ${error.message}`);
      }
      throw new Error('AWS authentication failed with unknown error');
    }
  }
}
