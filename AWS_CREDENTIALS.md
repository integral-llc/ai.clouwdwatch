# AWS Credentials Management

## Overview

The CloudWatch AI Analyzer now includes a built-in AWS credentials manager that allows you to securely input and validate AWS credentials directly from the UI.

## Features

- **Modal Input**: Click the "AWS Credentials" button in the header to open the credentials modal
- **Export Format Parsing**: Automatically parses AWS credentials from standard export format
- **STS Validation**: Validates credentials using AWS STS GetCallerIdentity
- **Status Bar**: Displays real-time connection status at the bottom of the app
- **Account Display**: Shows your AWS account number when connected
- **Session Storage**: Stores credentials in browser localStorage for the session

## Usage

### 1. Open Credentials Modal

Click the **AWS Credentials** button (key icon) in the top-right header.

### 2. Paste Credentials

Paste your AWS credentials in the standard export format:

```bash
export AWS_ACCESS_KEY_ID="ASIA6RQ3WEUGUPFHXSY3"
export AWS_SECRET_ACCESS_KEY="Ccg7KFdVgYJsQVSwh5BNMBaae1GDvxyWqsETareH"
export AWS_SESSION_TOKEN="IQoJb3JpZ2luX2VjED..."
export AWS_REGION="us-east-1"
```

**Note**: Session tokens are optional but required for temporary credentials (e.g., from AWS SSO or assumed roles).

### 3. Connect

Click the **Connect** button. The app will:
1. Parse your credentials
2. Validate them using AWS STS
3. Display your AWS account number
4. Store them securely in your browser

## Status Bar

The status bar at the bottom shows:

- **🟢 Connected**: Credentials are valid and connected
  - Displays AWS account number
- **🔴 Error**: Credentials validation failed
  - Shows error message
- **⚪ Not Connected**: No credentials configured
  - Click "Connect" link to open modal

## Security Notes

- Credentials are stored in browser localStorage (client-side only)
- Credentials are NOT sent to any external servers
- The app connects directly to AWS services from your browser
- Clear your browser data to remove stored credentials
- Use temporary credentials (with session tokens) when possible

## Supported Credential Types

1. **IAM User Access Keys** (long-term)
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY

2. **Temporary Security Credentials** (recommended)
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_SESSION_TOKEN (required)

## Required Permissions

Your AWS credentials need these permissions:
- `sts:GetCallerIdentity` (for validation)
- `logs:DescribeLogGroups` (for listing log groups)
- `logs:FilterLogEvents` (for querying logs)

## Troubleshooting

### "AWS authentication failed: The security token included in the request is invalid"
- Session token has expired (get fresh credentials)
- Credentials are malformed (check copy/paste)

### "AWS authentication failed: User is not authorized to perform: sts:GetCallerIdentity"
- Missing STS permissions
- Credentials are invalid or revoked

### "Missing required credentials"
- Make sure you've included both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
- Check the export format is correct

## Example: AWS SSO Credentials

If using AWS SSO, get your credentials with:

```bash
aws sso login --profile your-profile
aws configure export-credentials --profile your-profile
```

Then copy the export commands into the modal.
