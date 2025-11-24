# CloudWatch AI Analyzer

[![Build Status](https://img.shields.io/github/actions/workflow/status/yourusername/cloudwatch-analyzer/ci.yml?branch=main)](https://github.com/yourusername/cloudwatch-analyzer/actions)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

An AI-powered CloudWatch log analyzer with autonomous tool calling, built with Next.js 15, Vercel AI SDK, and AWS SDK.

## ✨ Features

- **🤖 AI Tool Calling**: GPT-4 autonomously uses tools to query CloudWatch (Vercel AI SDK v5)
- **☁️ Real AWS CloudWatch Integration**: Direct connection to your AWS CloudWatch Logs
- **🧠 Schema Discovery**: AI automatically discovers log structure before querying
- **🔄 Streaming Responses**: Real-time Server-Sent Events (SSE) shows AI thinking live
- **🛠️ Multi-Step Reasoning**: AI chains multiple tools (list → sample → analyze → query)
- **📊 Virtual Grid**: High-performance log viewer with virtual scrolling (1000+ logs)
- **🔍 JSON Viewer**: Expandable JSON viewer for detailed log inspection
- **🎨 Modern UI**: ShadCN UI with greenish theme, dark mode support
- **💬 Conversational**: Ask questions naturally, AI asks for clarification when needed
- **📈 Analytics**: AI-powered insights, status code analysis, error pattern detection

## 🏗️ Architecture

```
├── Chat Panel (Left)              ├── Log Viewer (Right)
│   - Conversational UI            │   - Virtual scrolling grid
│   - Chain-of-thought display     │   - Search & filter
│   - Streaming responses          │   - Log level badges
│                                  │
│                                  ├── JSON Viewer (Bottom Right)
│                                      - Expandable JSON view
│                                      - Syntax highlighting
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure AWS Credentials

**Configuration Required:**

Create `.env.local` file:

```bash
cp env.example .env.local
```

Edit `.env.local`:

```env
# REQUIRED - OpenAI for AI reasoning
OPENAI_API_KEY=sk-your-openai-api-key-here

# REQUIRED - AWS CloudWatch access
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_LOG_GROUP_NAME=/aws/lambda/your-function
```

**Both OpenAI and AWS credentials are required for the application to work.**

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📖 Usage Examples

Ask natural language questions:

- **"Show me all 404 errors"**
- **"How many error status codes do I have?"**
- **"Find all ERROR level logs from the last hour"**
- **"Show me logs with status code 500"**
- **"Analyze warning patterns"**

The AI will:
1. 🔍 **Discover** - Use `listLogGroups` tool to find relevant log groups
2. 📋 **Sample** - Use `fetchSampleLogs` to understand the log structure
3. 🧠 **Analyze** - Use `analyzeLogStructure` to discover available fields
4. 🎯 **Query** - Use `executeSearchAndAggregate` with discovered schema
5. 💡 **Explain** - Stream reasoning and insights in real-time

## 🔐 AWS IAM Permissions

Your AWS credentials need these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:FilterLogEvents",
        "logs:DescribeLogGroups"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **UI**: ShadCN UI, Tailwind CSS v4, Framer Motion
- **AWS**: @aws-sdk/client-cloudwatch-logs
- **AI**: Vercel AI SDK v5 (@ai-sdk/openai), tool calling with GPT-4o
- **Components**: 
  - @tanstack/react-table (log grid)
  - react-json-view-lite (JSON viewer)
  - Lucide React (icons)

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts        # Streaming chat API with tool calling
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Main application
│   │   └── globals.css              # Theme
│   ├── components/
│   │   ├── ChatPanel.tsx            # Chat interface with SSE
│   │   ├── LogViewer.tsx            # Compact grid with react-table
│   │   ├── JsonViewer.tsx           # JSON inspector
│   │   ├── ChainOfThought.tsx       # AI reasoning steps UI
│   │   └── ResizablePanels.tsx      # Draggable splitter
│   ├── lib/
│   │   ├── config.ts                # Centralized configuration
│   │   ├── logger.ts                # Logging service
│   │   ├── cloudwatch-service.ts    # AWS SDK integration
│   │   ├── tools/
│   │   │   └── cloudwatch-tools.ts  # AI tools (Vercel AI SDK)
│   │   └── utils.ts                 # Utility functions
│   └── types/
│       └── index.ts                 # TypeScript definitions
├── tests/
│   ├── integration/                 # End-to-end tests
│   │   ├── api-endpoint.test.ts     # API endpoint tests
│   │   └── tool-calling.test.ts     # Full AI workflow tests
│   └── unit/                        # Unit tests
│       └── simple-tool.test.ts      # Individual tool tests
└── README.md
```

## 🏛️ Architecture

**AI Tool Calling System:**
- AI autonomously decides which tools to use and when
- Multi-step reasoning with Vercel AI SDK v5
- Schema discovery before querying
- Streaming Server-Sent Events for real-time updates

**Code Design:**
- SOLID principles with centralized configuration
- Type-safe TypeScript throughout
- Service layer pattern for AWS integration
- Modular tool system for easy extensibility

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run Unit Tests
```bash
npm run test:unit
```

See [tests/README.md](./tests/README.md) for detailed testing documentation.

## 🎨 Customization

### Change Theme Colors

Edit `src/app/globals.css` and modify the `--primary`, `--secondary`, and `--accent` CSS variables.

### Change Log Group

Set `AWS_LOG_GROUP_NAME` in `.env.local` or pass `logGroupName` parameter to queries.

### Add More AI Tools

Create new tools in `src/lib/tools/` using the Vercel AI SDK `tool()` function with Zod schemas.

## 🚀 Production Deployment

```bash
npm run build
npm start
```

Or deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/cloudwatch-analyzer)

## 📝 License

This project is licensed under the GNU General Public License v3.0 - see below for details.

```
CloudWatch AI Analyzer - AI-powered AWS CloudWatch log analysis
Copyright (C) 2025

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```

## 🤝 Contributing

Contributions are welcome! Please ensure:
- All contributions are licensed under GPL v3
- Code follows the existing TypeScript patterns
- Tests are included for new features
- Documentation is updated

## 🐛 Issues

Found a bug? [Open an issue](https://github.com/yourusername/cloudwatch-analyzer/issues)

## ⭐ Support

If you find this project useful, please give it a star!
