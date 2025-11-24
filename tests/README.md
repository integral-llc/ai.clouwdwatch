# Tests

## Structure

```
tests/
├── integration/          # End-to-end integration tests
│   ├── api-endpoint.test.ts    # Tests /api/chat endpoint
│   └── tool-calling.test.ts    # Tests full AI tool calling flow
└── unit/                # Unit tests
    └── simple-tool.test.ts     # Tests individual tool execution
```

## Running Tests

### All Tests
```bash
npm test
```

### Integration Tests
```bash
npx tsx tests/integration/api-endpoint.test.ts
npx tsx tests/integration/tool-calling.test.ts
```

### Unit Tests
```bash
npx tsx tests/unit/simple-tool.test.ts
```

## Prerequisites

Before running tests, ensure:
1. `.env.local` is configured with valid credentials
2. Dev server is running (`npm run dev`) for API endpoint tests
3. AWS credentials have CloudWatch access

## Test Coverage

- **API Endpoint Tests**: Validates SSE streaming and tool result handling
- **Tool Calling Tests**: Verifies AI autonomously calls and chains tools
- **Simple Tool Tests**: Validates individual tool schemas and execution

## Adding New Tests

1. **Unit tests** → `tests/unit/` - Test individual functions/tools
2. **Integration tests** → `tests/integration/` - Test full workflows

Name files with `.test.ts` extension.
