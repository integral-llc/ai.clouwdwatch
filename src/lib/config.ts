/**
 * Application Configuration Module
 * Follows Single Responsibility Principle - manages all configuration
 */

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AWSConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  logGroupName?: string;
}

export interface CloudWatchConfig {
  maxResults: number;
  defaultTimeRangeHours: number;
}

export interface AppConfig {
  enableAIAnalysis: boolean;
  enableStreaming: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export class ConfigurationService {
  private static instance: ConfigurationService;

  private constructor() {
    // Singleton pattern from Gang of Four
  }

  static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  get openai(): OpenAIConfig {
    return {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000', 10),
    };
  }

  get aws(): AWSConfig {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      logGroupName: process.env.AWS_LOG_GROUP_NAME,
    };
  }

  get cloudWatch(): CloudWatchConfig {
    return {
      maxResults: parseInt(process.env.CLOUDWATCH_MAX_RESULTS || '1000', 10),
      defaultTimeRangeHours: parseInt(process.env.CLOUDWATCH_DEFAULT_TIME_RANGE_HOURS || '24', 10),
    };
  }

  get app(): AppConfig {
    return {
      enableAIAnalysis: process.env.ENABLE_AI_ANALYSIS !== 'false',
      enableStreaming: process.env.ENABLE_STREAMING !== 'false',
      logLevel: (process.env.LOG_LEVEL || 'info') as AppConfig['logLevel'],
    };
  }

  // Validation methods
  isOpenAIConfigured(): boolean {
    return !!this.openai.apiKey;
  }

  isAWSConfigured(): boolean {
    return !!this.aws.accessKeyId && !!this.aws.secretAccessKey;
  }

  getLogGroupName(): string {
    if (!this.aws.logGroupName) {
      throw new Error('AWS_LOG_GROUP_NAME environment variable is not set');
    }
    return this.aws.logGroupName;
  }

  validate(): string[] {
    const errors: string[] = [];

    if (!this.isOpenAIConfigured() && this.app.enableAIAnalysis) {
      errors.push('OPENAI_API_KEY is required when ENABLE_AI_ANALYSIS is true');
    }

    return errors;
  }
}

// Export singleton instance
export const config = ConfigurationService.getInstance();
