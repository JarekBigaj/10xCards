import type { AiCandidate, GenerationMetadata, AiServiceError } from "../../types";
import type { FlashcardGenerationRequest, GeneratedFlashcard } from "../../types";
import { OpenRouterService, createOpenRouterService } from "./openrouter.service";

// Maximum retry attempts with exponential backoff
const MAX_RETRY_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

/**
 * Generate MD5 hash for caching purposes
 */
export function generateTextHash(text: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());

  // Simple hash implementation for demo - in production use crypto.subtle
  let hash = 0;
  for (const char of data) {
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Mock flashcard candidates for testing (fallback only)
 */
const MOCK_CANDIDATES: {
  front_text: string;
  back_text: string;
  confidence: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}[] = [
  {
    front_text: "What is the capital of France?",
    back_text: "Paris is the capital and largest city of France, located in the north-central part of the country.",
    confidence: 0.95,
    difficulty: "easy",
    category: "Geography",
  },
  {
    front_text: "Define photosynthesis",
    back_text:
      "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.",
    confidence: 0.92,
    difficulty: "medium",
    category: "Biology",
  },
  {
    front_text: "What is the Pythagorean theorem?",
    back_text:
      "The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c²",
    confidence: 0.88,
    difficulty: "medium",
    category: "Mathematics",
  },
  {
    front_text: "Who wrote Romeo and Juliet?",
    back_text:
      "William Shakespeare wrote Romeo and Juliet, one of his most famous tragedies, written in the early part of his career.",
    confidence: 0.97,
    difficulty: "easy",
    category: "Literature",
  },
  {
    front_text: "What is DNA?",
    back_text:
      "DNA (Deoxyribonucleic acid) is the hereditary material that contains genetic instructions for the development and function of living organisms.",
    confidence: 0.93,
    difficulty: "medium",
    category: "Biology",
  },
];

/**
 * AI Service class for generating flashcard candidates
 * Now uses OpenRouter service for AI generation by default
 */
export class AiService {
  private readonly openRouterService: OpenRouterService;
  private useMockData: boolean; // Make mutable for fallback logic

  constructor(apiKey?: string) {
    // Default to using OpenRouter instead of mocks
    this.useMockData = false; // Use real OpenRouter service

    console.log("AiService constructor - useMockData:", this.useMockData);
    console.log("AiService constructor - apiKey:", apiKey ? "PROVIDED" : "NOT_PROVIDED");

    if (this.useMockData) {
      // Create mock service for testing/fallback
      console.log("Creating mock OpenRouter service");
      this.openRouterService = createOpenRouterService(apiKey, true);
    } else {
      // Create real OpenRouter service
      console.log("Creating real OpenRouter service");
      this.openRouterService = createOpenRouterService(apiKey, false);
    }
  }

  /**
   * Generate flashcard candidates from input text
   */
  async generateCandidates(
    text: string,
    retryCount = 0
  ): Promise<{ candidates: AiCandidate[]; metadata: GenerationMetadata }> {
    const startTime = Date.now();

    console.log("AiService.generateCandidates - useMockData:", this.useMockData);
    console.log("AiService.generateCandidates - text length:", text.length);

    try {
      // TEMPORARY: Force fallback to mock data if OpenRouter fails
      if (!this.useMockData) {
        console.log("TEMPORARY: Attempting OpenRouter, but will fallback to mock on any error");
      }
      let candidates: {
        front_text: string;
        back_text: string;
        confidence: number;
        difficulty: "easy" | "medium" | "hard";
        category: string;
      }[];

      if (this.useMockData) {
        // Use mock data for testing/fallback
        candidates = await this.generateMockCandidates(text);
      } else {
        // Use OpenRouter service for real AI generation
        const topic = this.generateTopicFromText(text);
        // Ensure we leave space for ellipsis if needed
        const maxContextLength = 997; // 1000 - 3 for "..." if needed
        const additionalContext = text.length > maxContextLength ? text.substring(0, maxContextLength) + "..." : text;

        const request: FlashcardGenerationRequest = {
          topic,
          difficulty_level: "medium",
          count: 5,
          additional_context: additionalContext, // Use truncated text as additional context
          retry_count: retryCount,
        };

        // Verify topic length is within limits
        if (request.topic.length > 200) {
          console.error("ERROR: Generated topic exceeds 200 characters:", request.topic.length);
          throw new Error(`Generated topic is too long: ${request.topic.length} characters (max 200)`);
        }

        // Verify additional_context length is within limits
        if (request.additional_context && request.additional_context.length > 1000) {
          console.error("ERROR: Additional context exceeds 1000 characters:", request.additional_context.length);
          throw new Error(`Additional context is too long: ${request.additional_context.length} characters (max 1000)`);
        }

        const response = await this.openRouterService.generateFlashcards(request);

        // Convert OpenRouter response to AiCandidate format
        candidates = response.flashcards.map((flashcard: GeneratedFlashcard) => ({
          front_text: flashcard.front_text,
          back_text: flashcard.back_text,
          confidence: this.calculateConfidence(flashcard.difficulty),
          difficulty: flashcard.difficulty,
          category: flashcard.category || "General", // Ensure category is always a string
        }));
      }

      const processingTime = Date.now() - startTime;

      // Add temporary UUIDs to candidates
      const candidatesWithIds = candidates.map((candidate) => ({
        ...candidate,
        id: crypto.randomUUID(),
      }));

      const metadata: GenerationMetadata = {
        model_used: this.useMockData
          ? "mock-model"
          : this.openRouterService.getServiceStatus().isHealthy
            ? "openrouter"
            : "fallback",
        processing_time_ms: processingTime,
        retry_count: retryCount,
      };

      return { candidates: candidatesWithIds, metadata };
    } catch (error) {
      console.error("AiService.generateCandidates - Error occurred:", error);
      console.log("AiService.generateCandidates - Current useMockData:", this.useMockData);

      // Handle retryable errors
      if (this.isRetryableError(error) && retryCount < MAX_RETRY_ATTEMPTS) {
        console.log("AiService.generateCandidates - Retrying due to retryable error");
        const delay = this.calculateRetryDelay(retryCount);
        await this.sleep(delay);
        return this.generateCandidates(text, retryCount + 1);
      }

      // If OpenRouter fails and we're not already using mocks, fallback to mocks
      if (!this.useMockData && this.shouldFallbackToMock(error)) {
        console.warn("OpenRouter service failed, falling back to mock data:", error);
        this.useMockData = true;
        return this.generateCandidates(text, retryCount);
      }

      // Convert error to AiServiceError
      console.error("AiService.generateCandidates - Converting to AiServiceError");
      const aiError = this.convertToAiServiceError(error);
      throw aiError;
    }
  }

  /**
   * Generate flashcard candidates with custom parameters
   */
  async generateCustomCandidates(
    request: FlashcardGenerationRequest,
    retryCount = 0
  ): Promise<{ candidates: AiCandidate[]; metadata: GenerationMetadata }> {
    const startTime = Date.now();

    console.log("AiService.generateCustomCandidates - useMockData:", this.useMockData);
    console.log("AiService.generateCustomCandidates - request:", request);

    try {
      let candidates: {
        front_text: string;
        back_text: string;
        confidence: number;
        difficulty: "easy" | "medium" | "hard";
        category: string;
      }[];

      if (this.useMockData) {
        // Use mock data for testing/fallback
        candidates = await this.generateMockCandidates(request.topic);
      } else {
        // Use OpenRouter service for real AI generation
        const response = await this.openRouterService.generateFlashcards(request);

        // Convert OpenRouter response to AiCandidate format
        candidates = response.flashcards.map((flashcard: GeneratedFlashcard) => ({
          front_text: flashcard.front_text,
          back_text: flashcard.back_text,
          confidence: this.calculateConfidence(flashcard.difficulty),
          difficulty: flashcard.difficulty,
          category: flashcard.category || "General", // Ensure category is always a string
        }));
      }

      const processingTime = Date.now() - startTime;

      // Add temporary UUIDs to candidates
      const candidatesWithIds = candidates.map((candidate) => ({
        ...candidate,
        id: crypto.randomUUID(),
      }));

      const metadata: GenerationMetadata = {
        model_used: this.useMockData
          ? "mock-model"
          : this.openRouterService.getServiceStatus().isHealthy
            ? "openrouter"
            : "fallback",
        processing_time_ms: processingTime,
        retry_count: request.retry_count || retryCount,
      };

      return { candidates: candidatesWithIds, metadata };
    } catch (error) {
      console.error("AiService.generateCustomCandidates - Error occurred:", error);
      console.log("AiService.generateCustomCandidates - Current useMockData:", this.useMockData);

      // Handle retryable errors
      if (this.isRetryableError(error) && retryCount < MAX_RETRY_ATTEMPTS) {
        console.log("AiService.generateCustomCandidates - Retrying due to retryable error");
        const delay = this.calculateRetryDelay(retryCount);
        await this.sleep(delay);
        return this.generateCustomCandidates(request, retryCount + 1);
      }

      // If OpenRouter fails and we're not already using mocks, fallback to mocks
      if (!this.useMockData && this.shouldFallbackToMock(error)) {
        console.warn("OpenRouter service failed, falling back to mock data:", error);
        this.useMockData = true;
        return this.generateCustomCandidates(request, retryCount);
      }

      // Convert error to AiServiceError
      const aiError = this.convertToAiServiceError(error);
      throw aiError;
    }
  }

  /**
   * Calculate confidence score based on difficulty level
   */
  private calculateConfidence(difficulty: "easy" | "medium" | "hard"): number {
    const baseConfidence = {
      easy: 0.95,
      medium: 0.9,
      hard: 0.85,
    };

    // Add some variance to make it more realistic
    const variance = (Math.random() - 0.5) * 0.1;
    return Math.min(0.99, Math.max(0.7, baseConfidence[difficulty] + variance));
  }

  /**
   * Generate mock flashcard candidates for testing/fallback
   */
  private async generateMockCandidates(text: string): Promise<
    {
      front_text: string;
      back_text: string;
      confidence: number;
      difficulty: "easy" | "medium" | "hard";
      category: string;
    }[]
  > {
    // Simulate processing delay
    await this.sleep(500 + Math.random() * 1000);

    // Generate hash-based selection of mock candidates
    const textHash = generateTextHash(text);
    const hashNum = parseInt(textHash.slice(-2), 16);

    // Select 3-5 candidates based on text hash for consistency
    const numCandidates = 3 + (hashNum % 3);
    const selectedCandidates: {
      front_text: string;
      back_text: string;
      confidence: number;
      difficulty: "easy" | "medium" | "hard";
      category: string;
    }[] = [];

    for (let i = 0; i < numCandidates; i++) {
      const index = (hashNum + i) % MOCK_CANDIDATES.length;
      const mockCandidate = MOCK_CANDIDATES[index];

      console.log("Mock candidate at index", index, ":", mockCandidate);

      selectedCandidates.push({
        ...mockCandidate,
        // Slightly vary confidence based on text characteristics
        confidence: Math.min(0.99, mockCandidate.confidence + (Math.random() * 0.1 - 0.05)),
        // Ensure difficulty and category are included
        difficulty: mockCandidate.difficulty,
        category: mockCandidate.category || "General", // Ensure category is always a string
      });

      console.log("Candidate after processing:", selectedCandidates[selectedCandidates.length - 1]);
    }

    console.log("Selected candidates:", selectedCandidates);
    return selectedCandidates;
  }

  /**
   * Get OpenRouter service status
   */
  getOpenRouterStatus() {
    return this.openRouterService.getServiceStatus();
  }

  /**
   * Get detailed OpenRouter metrics
   */
  getOpenRouterMetrics() {
    return this.openRouterService.getDetailedMetrics();
  }

  /**
   * Change AI model used by OpenRouter service
   */
  setModel(model: string): void {
    if (!this.useMockData) {
      this.openRouterService.setModel(model);
    }
  }

  /**
   * Update OpenRouter service configuration
   */
  updateOpenRouterConfig(config: Parameters<typeof this.openRouterService.updateConfig>[0]): void {
    if (!this.useMockData) {
      this.openRouterService.updateConfig(config);
    }
  }

  /**
   * Check if error should trigger fallback to mock data
   */
  private shouldFallbackToMock(error: unknown): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.log("shouldFallbackToMock - errorMessage:", errorMessage);

    // Fallback for critical errors that make OpenRouter unusable
    const shouldFallback =
      errorMessage?.includes("API key") ||
      errorMessage?.includes("authentication") ||
      errorMessage?.includes("circuit breaker") ||
      errorMessage?.includes("service unavailable") ||
      errorMessage?.includes("OpenRouter") ||
      errorMessage?.includes("Invalid response") ||
      errorMessage?.includes("parse");

    console.log("shouldFallbackToMock - result:", shouldFallback);
    return shouldFallback;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage?.includes("rate limit") || errorMessage?.includes("429")) {
      return true;
    }
    if (errorMessage?.includes("timeout") || errorMessage?.includes("TIMEOUT")) {
      return true;
    }
    if (errorMessage?.includes("503") || errorMessage?.includes("502")) {
      return true;
    }
    return false;
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = BASE_DELAY_MS * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.4 - 0.2; // ±20% jitter
    return Math.floor(baseDelay * (1 + jitter));
  }

  /**
   * Sleep utility function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Convert any error to AiServiceError
   */
  private convertToAiServiceError(error: unknown): AiServiceError {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage?.includes("rate limit") || errorMessage?.includes("429")) {
      return {
        code: "RATE_LIMIT",
        message: "AI service rate limit exceeded",
        is_retryable: true,
        retry_after: 60,
      };
    }

    if (errorMessage?.includes("timeout")) {
      return {
        code: "TIMEOUT",
        message: "AI service request timed out",
        is_retryable: true,
      };
    }

    if (errorMessage?.includes("Invalid response") || errorMessage?.includes("parse")) {
      return {
        code: "MODEL_ERROR",
        message: "AI service returned invalid response",
        is_retryable: false,
      };
    }

    return {
      code: "UNKNOWN",
      message: errorMessage || "Unknown AI service error",
      is_retryable: false,
    };
  }

  /**
   * Generate a concise topic from input text (max 200 chars for OpenRouter)
   */
  private generateTopicFromText(text: string): string {
    // If text is already short enough, use it as is
    if (text.length <= 200) {
      return text;
    }

    // We need to ensure the final topic is <= 200 chars
    // Account for potential ellipsis (3 chars)
    const maxLength = 197; // 200 - 3 for ellipsis
    const truncated = text.substring(0, maxLength);

    // Look for sentence endings (., !, ?) to make a clean cut
    const sentenceEndings = [".", "!", "?", "\n"];
    let bestCut = maxLength;

    for (const ending of sentenceEndings) {
      const lastIndex = truncated.lastIndexOf(ending);
      if (lastIndex > maxLength * 0.7) {
        // Only cut if we're not losing too much
        bestCut = lastIndex + 1;
        break;
      }
    }

    // If no good sentence boundary found, look for word boundaries
    if (bestCut === maxLength) {
      const lastSpace = truncated.lastIndexOf(" ");
      if (lastSpace > maxLength * 0.8) {
        bestCut = lastSpace;
      }
    }

    const topic = text.substring(0, bestCut).trim();

    // Always add ellipsis since we truncated
    return topic + "...";
  }
}

/**
 * Factory function to create AI service instance
 */
export function createAiService(apiKey?: string): AiService {
  return new AiService(apiKey);
}
