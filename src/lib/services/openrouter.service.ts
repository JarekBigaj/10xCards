import type {
  OpenRouterServiceConfig,
  FlashcardGenerationRequest,
  FlashcardGenerationResponse,
  OpenRouterRequestWithFormat,
  OpenRouterResponse,
  ServiceStatus,
  JSONSchema,
  GeneratedFlashcard,
} from "../../types";
import { FLASHCARD_SCHEMA, FLASHCARD_SYSTEM_PROMPT } from "./flashcard-schema";
import { CircuitBreakerError, OpenRouterErrorFactory } from "./openrouter-errors";
import { CircuitBreaker, type CircuitBreakerMetrics } from "./circuit-breaker";
import { RetryManager } from "./retry-manager";

/**
 * Default configuration for OpenRouter service
 */
const DEFAULT_CONFIG: OpenRouterServiceConfig = {
  baseUrl: "https://openrouter.ai/api/v1",
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000, // 1 minute
};

/**
 * Available AI models for flashcard generation
 */
const AVAILABLE_MODELS = ["openai/gpt-4o-mini"] as const;

/**
 * OpenRouter Service for AI-powered flashcard generation
 * Implements circuit breaker pattern, intelligent retry, and structured responses
 */
export class OpenRouterService {
  private readonly config: OpenRouterServiceConfig;
  private readonly apiKey: string;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly retryManager: RetryManager;
  private currentModel: string;
  private requestCount = 0;
  private lastError?: string;

  constructor(apiKey?: string, useMockData = true, config?: Partial<OpenRouterServiceConfig>) {
    this.apiKey = apiKey || import.meta.env.OPENROUTER_API_KEY;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentModel = import.meta.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini";

    if (!this.apiKey && !useMockData) {
      throw new Error("OpenRouter API key is required when not using mock data");
    }

    // Initialize circuit breaker with service configuration
    this.circuitBreaker = new CircuitBreaker({
      threshold: this.config.circuitBreakerThreshold,
      timeout: this.config.circuitBreakerTimeout,
      halfOpenMaxRequests: 3,
      windowSize: 300000, // 5 minutes
      minRequestCount: 10,
    });

    // Initialize retry manager
    this.retryManager = new RetryManager();
  }

  /**
   * Generate flashcards based on the provided request
   */
  async generateFlashcards(request: FlashcardGenerationRequest): Promise<FlashcardGenerationResponse> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      // Validate input request
      this.validateFlashcardRequest(request);

      // Check circuit breaker status
      if (!this.circuitBreaker.canExecute()) {
        throw new CircuitBreakerError("Service temporarily unavailable due to high error rate");
      }

      // Build prompts for AI generation
      const systemPrompt = this.buildSystemPrompt(request);
      const userPrompt = this.buildUserPrompt(request);

      // Prepare OpenRouter request with structured response format
      const openRouterRequest: OpenRouterRequestWithFormat = {
        model: this.currentModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.9,
        // TEMPORARILY DISABLED: response_format for debugging
        // response_format: {
        //   type: "json_schema",
        //   json_schema: {
        //     name: "flashcard_schema",
        //     strict: true,
        //     schema: FLASHCARD_SCHEMA,
        //   },
        // },
      };

      // Generate cache key for request
      const cacheKey = this.generateCacheKey(request);

      // Call OpenRouter API with retry mechanism and caching
      const retryResult = await this.retryManager.executeWithRetry(
        () => this.callOpenRouter(openRouterRequest),
        "default",
        cacheKey,
        300000 // 5 minutes cache TTL
      );

      const response = retryResult.data as OpenRouterResponse;

      // Parse and validate structured response
      const parsedResponse = this.parseStructuredResponse(response.choices[0].message.content, FLASHCARD_SCHEMA);

      // Update circuit breaker on success
      this.circuitBreaker.onSuccess(retryResult.totalTime);

      return {
        flashcards: parsedResponse.flashcards,
        metadata: {
          model_used: this.currentModel,
          processing_time_ms: Date.now() - startTime,
          retry_count: request.retry_count || 0,
        },
      };
    } catch (error) {
      this.circuitBreaker.onFailure();
      this.lastError = error instanceof Error ? error.message : String(error);
      throw this.convertToOpenRouterError(error);
    }
  }

  /**
   * Change the AI model used for generation
   */
  setModel(model: string): void {
    if (!AVAILABLE_MODELS.includes(model as (typeof AVAILABLE_MODELS)[number])) {
      throw new Error(`Unsupported model: ${model}. Available models: ${AVAILABLE_MODELS.join(", ")}`);
    }
    this.currentModel = model;
  }

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<OpenRouterServiceConfig>): void {
    Object.assign(this.config, config);

    // Update circuit breaker configuration if relevant
    if (config.circuitBreakerThreshold || config.circuitBreakerTimeout) {
      this.circuitBreaker.reset();
    }
  }

  /**
   * Get current service status and circuit breaker state
   */
  getServiceStatus(): ServiceStatus {
    return {
      isHealthy: this.circuitBreaker.isHealthy(),
      circuitBreakerState: this.circuitBreaker.getState(),
      lastError: this.lastError,
      requestCount: this.requestCount,
    };
  }

  /**
   * Get detailed service metrics
   */
  getDetailedMetrics(): {
    service: ServiceStatus;
    circuitBreaker: CircuitBreakerMetrics;
    retry: ReturnType<RetryManager["getStats"]>;
    cache: ReturnType<RetryManager["getCacheStats"]>;
  } {
    return {
      service: this.getServiceStatus(),
      circuitBreaker: this.circuitBreaker.getMetrics(),
      retry: this.retryManager.getStats(),
      cache: this.retryManager.getCacheStats(),
    };
  }

  /**
   * Reset circuit breaker manually
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  /**
   * Force circuit breaker to open state
   */
  forceCircuitBreakerOpen(reason: string): void {
    this.circuitBreaker.forceOpen(reason);
  }

  /**
   * Call OpenRouter API with proper headers and error handling
   */
  private async callOpenRouter(request: OpenRouterRequestWithFormat): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://10xcards.app",
          "X-Title": "10xCards - AI Flashcard Generator",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        const error = OpenRouterErrorFactory.fromHttpStatus(response.status, errorData);
        throw error;
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from OpenRouter API");
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timed out");
      }

      throw error;
    }
  }

  /**
   * Parse structured response according to JSON schema
   */
  private parseStructuredResponse(response: string, schema: JSONSchema): { flashcards: GeneratedFlashcard[] } {
    try {
      // Extract JSON from response with improved parsing
      let jsonString = response.trim();

      // Remove markdown code blocks if present
      const codeBlockMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
      }

      // Find the main JSON object/array
      let startIndex = -1;
      let endIndex = -1;

      // Look for opening bracket/brace
      for (let i = 0; i < jsonString.length; i++) {
        if (jsonString[i] === "{" || jsonString[i] === "[") {
          startIndex = i;
          break;
        }
      }

      if (startIndex === -1) {
        throw new Error("No valid JSON found in response");
      }

      // Find matching closing bracket/brace
      const openChar = jsonString[startIndex];
      const closeChar = openChar === "{" ? "}" : "]";
      let depth = 0;

      for (let i = startIndex; i < jsonString.length; i++) {
        if (jsonString[i] === openChar) depth++;
        if (jsonString[i] === closeChar) depth--;

        if (depth === 0) {
          endIndex = i;
          break;
        }
      }

      if (endIndex === -1) {
        throw new Error("Incomplete JSON in response");
      }

      const extractedJson = jsonString.substring(startIndex, endIndex + 1);

      const parsedData = JSON.parse(extractedJson);

      // Handle both formats: direct array or object with flashcards property
      let normalizedData;
      if (Array.isArray(parsedData)) {
        // OpenRouter returned array directly, wrap it in expected format
        normalizedData = { flashcards: parsedData };
      } else if (parsedData && typeof parsedData === "object" && "flashcards" in parsedData) {
        // OpenRouter returned expected object format
        normalizedData = parsedData;
      } else {
        throw new Error("Invalid response format: expected array or object with flashcards property");
      }

      // Validate against schema
      this.validateAgainstSchema(normalizedData, schema);

      return normalizedData;
    } catch (error) {
      throw OpenRouterErrorFactory.createNonRetryableError(
        "VALIDATION_ERROR",
        `Failed to parse structured response: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: FlashcardGenerationRequest): string {
    const keyData = {
      topic: request.topic.toLowerCase().trim(),
      difficulty: request.difficulty_level,
      count: request.count,
      category: request.category?.toLowerCase().trim(),
      model: this.currentModel,
    };

    return `flashcards:${JSON.stringify(keyData)}`;
  }

  /**
   * Validate flashcard generation request
   */
  private validateFlashcardRequest(request: FlashcardGenerationRequest): void {
    if (!request.topic || request.topic.trim().length < 3) {
      throw new Error("Topic must be at least 3 characters long");
    }

    if (request.topic.length > 200) {
      throw new Error("Topic must be less than 200 characters");
    }

    if (request.count < 1 || request.count > 10) {
      throw new Error("Count must be between 1 and 10");
    }

    if (request.additional_context && request.additional_context.length > 1000) {
      throw new Error("Additional context must be less than 1000 characters");
    }
  }

  /**
   * Build system prompt for flashcard generation
   */
  private buildSystemPrompt(request: FlashcardGenerationRequest): string {
    let prompt = FLASHCARD_SYSTEM_PROMPT;

    if (request.category) {
      prompt += `\n\nCategory: ${request.category}`;
    }

    prompt += `\n\nDifficulty Level: ${request.difficulty_level}`;
    prompt += `\nNumber of Flashcards: ${request.count}`;

    return prompt;
  }

  /**
   * Build user prompt with topic and context
   */
  private buildUserPrompt(request: FlashcardGenerationRequest): string {
    let prompt = `Generate ${request.count} flashcards about: ${request.topic}`;

    if (request.additional_context) {
      prompt += `\n\nAdditional Context: ${request.additional_context}`;
    }

    prompt += `\n\nPlease ensure the difficulty level matches "${request.difficulty_level}" and respond with valid JSON in this exact format:
{
  "flashcards": [
    {
      "front_text": "question",
      "back_text": "answer", 
      "difficulty": "${request.difficulty_level}",
      "category": "category_name"
    }
  ]
}`;

    return prompt;
  }

  /**
   * Validate data against JSON schema
   */
  private validateAgainstSchema(data: unknown, schema: JSONSchema): void {
    // Basic validation - in production, use a proper JSON schema validator like zod or ajv
    if (!data || typeof data !== "object") {
      throw new Error("Response must be a valid object");
    }

    const dataObj = data as Record<string, unknown>;

    // Check required properties
    for (const requiredProp of schema.required) {
      if (!(requiredProp in dataObj)) {
        throw new Error(`Missing required property: ${requiredProp}`);
      }
    }

    // Check if additional properties are allowed
    if (!schema.additionalProperties) {
      const allowedProps = new Set([...schema.required, ...Object.keys(schema.properties)]);
      for (const prop of Object.keys(dataObj)) {
        if (!allowedProps.has(prop)) {
          throw new Error(`Unexpected property: ${prop}`);
        }
      }
    }
  }

  /**
   * Convert any error to OpenRouterServiceError
   */
  private convertToOpenRouterError(error: unknown): ReturnType<typeof OpenRouterErrorFactory.fromMessage> {
    if (error instanceof Error && "code" in error) {
      return error as ReturnType<typeof OpenRouterErrorFactory.fromMessage>;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return OpenRouterErrorFactory.fromMessage(errorMessage);
  }
}

/**
 * Factory function to create OpenRouter service instance
 */
export function createOpenRouterService(
  apiKey?: string,
  useMockData = true,
  config?: Partial<OpenRouterServiceConfig>
): OpenRouterService {
  return new OpenRouterService(apiKey, useMockData, config);
}
