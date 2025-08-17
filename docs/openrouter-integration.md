# OpenRouter Integration with Flashcard Service

## Overview

This document describes the integration between the OpenRouter service and the FlashcardService to generate AI-powered flashcard proposals using Large Language Models (LLMs).

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   FlashcardService│    │  OpenRouter     │
│   Components    │───▶│   (AI Service)   │───▶│  Service        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Supabase DB    │
                       │   (Flashcards)   │
                       └──────────────────┘
```

## Key Components

### 1. FlashcardService

- **Location**: `src/lib/services/flashcard.service.ts`
- **Purpose**: Main service for flashcard operations, now includes AI-powered generation
- **New Methods**:
  - `generateFlashcardProposals()` - Generate proposals with custom parameters
  - `generateProposalsFromText()` - Generate proposals from text input
  - `getAiServiceStatus()` - Get AI service health and metrics

### 2. AI Service

- **Location**: `src/lib/services/ai.service.ts`
- **Purpose**: Wrapper around OpenRouter service with fallback to mock data
- **Features**:
  - Automatic fallback to mocks if OpenRouter fails
  - Retry logic with exponential backoff
  - Confidence scoring based on difficulty levels

### 3. OpenRouter Service

- **Location**: `src/lib/services/openrouter.service.ts`
- **Purpose**: Direct communication with OpenRouter API
- **Features**:
  - Circuit breaker pattern for fault tolerance
  - Intelligent retry management
  - Structured JSON responses using schemas
  - Caching for performance optimization

## API Endpoints

### 1. Generate Flashcard Proposals (New)

- **Endpoint**: `POST /api/flashcards/generate-proposals`
- **Purpose**: Generate flashcard proposals using AI with custom parameters
- **Request Body**:

```json
{
  "topic": "JavaScript Fundamentals",
  "difficulty_level": "medium",
  "count": 5,
  "category": "Programming",
  "additional_context": "Focus on ES6+ features"
}
```

### 2. Generate AI Candidates (Updated)

- **Endpoint**: `POST /api/ai/generate-candidates`
- **Purpose**: Generate flashcard candidates from text input (backward compatible)
- **Request Body**:

```json
{
  "text": "Long text input (1000-10000 characters)"
}
```

## Configuration

### Environment Variables

```bash
# Required for OpenRouter integration
OPENROUTER_API_KEY=your_api_key_here

# Optional configuration
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini
```

### Service Configuration

```typescript
// Default configuration in OpenRouter service
const DEFAULT_CONFIG: OpenRouterServiceConfig = {
  baseUrl: "https://openrouter.ai/api/v1",
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000, // 1 minute
};
```

## Usage Examples

### 1. Basic Text-to-Flashcards

```typescript
import { FlashcardService } from "./lib/services/flashcard.service";
import { supabaseClient } from "./db/supabase.client";

const flashcardService = new FlashcardService(supabaseClient);

const result = await flashcardService.generateProposalsFromText("JavaScript is a programming language...", "user-id", {
  difficulty_level: "medium",
  count: 5,
  category: "Programming",
});
```

### 2. Custom Generation Parameters

```typescript
const result = await flashcardService.generateFlashcardProposals(
  {
    topic: "React Hooks",
    difficulty_level: "hard",
    count: 3,
    category: "Frontend Development",
    additional_context: "Focus on useState and useEffect",
  },
  "user-id"
);
```

### 3. Check Service Status

```typescript
const status = flashcardService.getAiServiceStatus();
console.log("OpenRouter healthy:", status.openRouterStatus.isHealthy);
console.log("Circuit breaker state:", status.openRouterStatus.circuitBreakerState);
```

## Error Handling

### Fallback Strategy

1. **Primary**: OpenRouter service with LLM generation
2. **Fallback**: Mock data generation if OpenRouter fails
3. **Error Types**:
   - Rate limiting (429)
   - Timeout errors
   - Authentication failures
   - Circuit breaker open

### Circuit Breaker States

- **CLOSED**: Service is healthy, requests pass through
- **OPEN**: Service is failing, requests are blocked
- **HALF_OPEN**: Testing if service has recovered

## Testing

### Run Integration Tests

```bash
npm run test:integration
```

### Test with Mock Data

```typescript
// Force mock mode for testing
const flashcardService = new FlashcardService(supabaseClient);
// The service will automatically fallback to mocks if OpenRouter fails
```

## Performance Considerations

### Caching

- Request-based caching with 5-minute TTL
- Hash-based cache keys for consistent results
- Reduces API calls and improves response times

### Rate Limiting

- Built-in rate limiting at the API level
- Exponential backoff for retries
- Circuit breaker prevents cascading failures

### Monitoring

- Request count and timing metrics
- Circuit breaker state tracking
- Error rate monitoring
- Cache hit/miss statistics

## Security

### API Key Management

- Environment variable storage
- No hardcoded keys in source code
- Proper error handling for missing keys

### Input Validation

- Schema-based validation using Zod
- Text length limits (3-200 chars for topics)
- Sanitization of user inputs

### Rate Limiting

- Per-user rate limiting
- Configurable limits and reset times
- Protection against abuse

## Troubleshooting

### Common Issues

1. **API Key Missing**

   ```
   Error: OpenRouter API key is required when not using mock data
   ```

   **Solution**: Set `OPENROUTER_API_KEY` environment variable

2. **Circuit Breaker Open**

   ```
   Error: Service temporarily unavailable due to high error rate
   ```

   **Solution**: Wait for circuit breaker to reset or check service health

3. **Rate Limit Exceeded**
   ```
   Error: Rate limit exceeded
   ```
   **Solution**: Wait for rate limit to reset or reduce request frequency

### Debug Mode

```typescript
// Enable detailed logging
const flashcardService = new FlashcardService(supabaseClient);
const status = flashcardService.getAiServiceStatus();
console.log("Detailed metrics:", status.openRouterMetrics);
```

## Future Enhancements

1. **Model Selection**: Allow users to choose different LLM models
2. **Custom Prompts**: User-defined generation prompts
3. **Batch Processing**: Generate multiple sets of flashcards
4. **Quality Metrics**: AI-generated quality scores
5. **User Feedback**: Learn from user corrections and preferences
