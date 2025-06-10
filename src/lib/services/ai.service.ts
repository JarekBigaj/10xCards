import type { AiCandidate, GenerationMetadata, AiModelConfig, AiServiceError, OpenRouterRequest } from "../../types";

// Default AI model configuration
const DEFAULT_AI_CONFIG: AiModelConfig = {
  model: "anthropic/claude-3-haiku",
  temperature: 0.7,
  max_tokens: 2000,
  top_p: 0.9,
};

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
 * Mock flashcard candidates for testing
 */
const MOCK_CANDIDATES: Omit<AiCandidate, "id">[] = [
  {
    front_text: "What is the capital of France?",
    back_text: "Paris is the capital and largest city of France, located in the north-central part of the country.",
    confidence: 0.95,
  },
  {
    front_text: "Define photosynthesis",
    back_text:
      "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen.",
    confidence: 0.92,
  },
  {
    front_text: "What is the Pythagorean theorem?",
    back_text:
      "The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c²",
    confidence: 0.88,
  },
  {
    front_text: "Who wrote Romeo and Juliet?",
    back_text:
      "William Shakespeare wrote Romeo and Juliet, one of his most famous tragedies, written in the early part of his career.",
    confidence: 0.97,
  },
  {
    front_text: "What is DNA?",
    back_text:
      "DNA (Deoxyribonucleic acid) is the hereditary material that contains genetic instructions for the development and function of living organisms.",
    confidence: 0.93,
  },
];

/**
 * System prompt for flashcard generation (ready for OpenRouter)
 */
const SYSTEM_PROMPT = `You are an expert flashcard creator. Your task is to analyze the given text and generate high-quality flashcards that help users learn and remember key information.

Instructions:
1. Generate 5-10 flashcards from the provided text
2. Each flashcard should have a clear, concise question (front) and accurate answer (back)
3. Focus on important concepts, definitions, facts, and relationships
4. Vary question types: definitions, explanations, examples, comparisons
5. Keep front text under 200 characters and back text under 500 characters
6. Ensure questions are specific and unambiguous
7. Make answers complete but concise

Return your response as a valid JSON array with this exact structure:
[
  {
    "front_text": "Question or prompt",
    "back_text": "Answer or explanation",
    "confidence": 0.85
  }
]

The confidence score should be between 0.7-1.0 based on how well the flashcard captures important information from the source text.`;

/**
 * AI Service class for generating flashcard candidates
 */
export class AiService {
  private readonly apiKey: string;
  private readonly baseUrl = "https://openrouter.ai/api/v1";
  private readonly useMockData: boolean;

  constructor(apiKey?: string, useMockData = true) {
    this.apiKey = apiKey || import.meta.env.OPENROUTER_API_KEY || "mock-key";
    this.useMockData = useMockData || !import.meta.env.OPENROUTER_API_KEY;
  }

  /**
   * Generate flashcard candidates from input text
   */
  async generateCandidates(
    text: string,
    retryCount = 0
  ): Promise<{ candidates: AiCandidate[]; metadata: GenerationMetadata }> {
    const startTime = Date.now();

    try {
      let candidates: Omit<AiCandidate, "id">[];

      if (this.useMockData) {
        // Use mock data for testing
        candidates = await this.generateMockCandidates(text);
      } else {
        // Use real OpenRouter API
        const request: OpenRouterRequest = {
          model: DEFAULT_AI_CONFIG.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Please generate flashcards from this text:\n\n${text}` },
          ],
          temperature: DEFAULT_AI_CONFIG.temperature,
          max_tokens: DEFAULT_AI_CONFIG.max_tokens,
          top_p: DEFAULT_AI_CONFIG.top_p,
        };

        const response = await this.callOpenRouter(request);
        candidates = await this.parseAiResponse(response);
      }

      const processingTime = Date.now() - startTime;

      // Add temporary UUIDs to candidates
      const candidatesWithIds = candidates.map((candidate) => ({
        ...candidate,
        id: crypto.randomUUID(),
      }));

      const metadata: GenerationMetadata = {
        model_used: this.useMockData ? "mock-model" : DEFAULT_AI_CONFIG.model,
        processing_time_ms: processingTime,
        retry_count: retryCount,
      };

      return { candidates: candidatesWithIds, metadata };
    } catch (error) {
      // Handle retryable errors
      if (this.isRetryableError(error) && retryCount < MAX_RETRY_ATTEMPTS) {
        const delay = this.calculateRetryDelay(retryCount);
        await this.sleep(delay);
        return this.generateCandidates(text, retryCount + 1);
      }

      // Convert error to AiServiceError
      const aiError = this.convertToAiServiceError(error);
      throw aiError;
    }
  }

  /**
   * Generate mock candidates for testing (simulates AI processing)
   */
  private async generateMockCandidates(text: string): Promise<Omit<AiCandidate, "id">[]> {
    // Simulate processing delay
    await this.sleep(500 + Math.random() * 1000);

    // Generate hash-based selection of mock candidates
    const textHash = generateTextHash(text);
    const hashNum = parseInt(textHash.slice(-2), 16);

    // Select 3-5 candidates based on text hash for consistency
    const numCandidates = 3 + (hashNum % 3);
    const selectedCandidates = [];

    for (let i = 0; i < numCandidates; i++) {
      const index = (hashNum + i) % MOCK_CANDIDATES.length;
      selectedCandidates.push({
        ...MOCK_CANDIDATES[index],
        // Slightly vary confidence based on text characteristics
        confidence: Math.min(0.99, MOCK_CANDIDATES[index].confidence + (Math.random() * 0.1 - 0.05)),
      });
    }

    return selectedCandidates;
  }

  /**
   * Call OpenRouter API with proper headers and error handling
   */
  private async callOpenRouter(request: OpenRouterRequest): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://10xcards.app",
        "X-Title": "10xCards - AI Flashcard Generator",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from OpenRouter API");
    }

    return data.choices[0].message.content;
  }

  /**
   * Parse AI response and validate flashcard structure
   */
  private async parseAiResponse(aiResponse: string): Promise<Omit<AiCandidate, "id">[]> {
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || aiResponse.match(/(\[[\s\S]*?\])/);

      if (!jsonMatch) {
        throw new Error("No valid JSON array found in AI response");
      }

      const parsedData = JSON.parse(jsonMatch[1]);

      if (!Array.isArray(parsedData)) {
        throw new Error("AI response is not an array");
      }

      // Validate and clean each candidate
      const candidates = parsedData
        .filter((item) => item && typeof item === "object")
        .map((item) => ({
          front_text: String(item.front_text || "")
            .trim()
            .substring(0, 200),
          back_text: String(item.back_text || "")
            .trim()
            .substring(0, 500),
          confidence: Math.min(Math.max(Number(item.confidence) || 0.5, 0), 1),
        }))
        .filter((item) => item.front_text.length > 0 && item.back_text.length > 0);

      if (candidates.length === 0) {
        throw new Error("No valid candidates found in AI response");
      }

      return candidates;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse AI response: ${error.message}`);
      }
      throw new Error("Failed to parse AI response: Unknown error");
    }
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
}

/**
 * Factory function to create AI service instance
 */
export function createAiService(useMockData = true): AiService {
  return new AiService(undefined, useMockData);
}
