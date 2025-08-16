import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// =============================================================================
// COMMON TYPES
// =============================================================================

/**
 * Standard API response wrapper for all endpoints
 */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Standard API error response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: ApiError[];
}

/**
 * Individual API error for detailed validation feedback
 */
export interface ApiError {
  field?: string;
  code: ApiErrorCode;
  message: string;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationDto {
  current_page: number;
  total_pages: number;
  total_count: number;
  limit: number;
}

/**
 * Source type for flashcards - how they were created
 */
export type FlashcardSource = "ai-full" | "ai-edit" | "manual";

/**
 * Review rating scale (1-4 as per ts-fsrs algorithm)
 */
export type ReviewRating = 1 | 2 | 3 | 4;

// =============================================================================
// AI GENERATION DTO TYPES
// =============================================================================

/**
 * Request body for AI flashcard candidate generation
 */
export interface AiGenerateCandidatesRequest {
  text: string; // 1000-10000 characters
  retry_count?: number; // For internal retry logic
}

/**
 * Individual AI-generated flashcard candidate (session storage only)
 */
export interface AiCandidate {
  id: string; // Temporary UUID for session tracking
  front_text: string; // Max 200 chars
  back_text: string; // Max 500 chars
  confidence: number; // 0-1 confidence score
  difficulty: "easy" | "medium" | "hard"; // Difficulty level
  category: string; // Category for organization (required)
}

/**
 * Metadata about the AI generation process
 */
export interface GenerationMetadata {
  model_used: string;
  processing_time_ms: number;
  retry_count: number;
}

/**
 * Response data for AI candidate generation
 */
export interface AiGenerateCandidatesResponseData {
  candidates: AiCandidate[];
  generation_metadata: GenerationMetadata;
}

/**
 * Complete response for AI candidate generation
 */
export type AiGenerateCandidatesResponse = ApiResponse<AiGenerateCandidatesResponseData>;

// =============================================================================
// FLASHCARD DTO TYPES
// =============================================================================

/**
 * Flashcard DTO for API responses - excludes sensitive/internal fields
 */
export type FlashcardDto = Omit<Tables<"flashcards">, "user_id" | "is_deleted" | "front_text_hash" | "back_text_hash">;

/**
 * Request body for creating a single flashcard
 */
export interface CreateFlashcardRequest {
  front_text: string; // Max 200 chars, required
  back_text: string; // Max 500 chars, required
  source: FlashcardSource; // Required
  candidate_id?: string; // Optional, for tracking AI candidates
}

/**
 * Request body for creating multiple flashcards
 */
export interface CreateFlashcardsRequest {
  flashcards: CreateFlashcardRequest[]; // Min 1, max 50 elements
}

/**
 * Response data for single flashcard creation
 */
export type CreateFlashcardResponse = ApiResponse<FlashcardDto>;

/**
 * Error details for failed flashcard creation in batch operations
 */
export interface FlashcardCreationError {
  index: number;
  front_text: string;
  error: string;
  code: "DUPLICATE" | "VALIDATION_ERROR";
}

/**
 * Response data for multiple flashcard creation
 */
export interface CreateFlashcardsResponseData {
  created_count: number;
  failed_count: number;
  flashcards: FlashcardDto[];
  errors: FlashcardCreationError[];
}

/**
 * Complete response for multiple flashcard creation
 */
export type CreateFlashcardsResponse = ApiResponse<CreateFlashcardsResponseData>;

/**
 * Request body for updating an existing flashcard
 */
export interface UpdateFlashcardRequest {
  front_text?: string; // Max 200 chars, optional
  back_text?: string; // Max 500 chars, optional
  source: "ai-edit" | "manual"; // Required, cannot update to 'ai-full'
}

/**
 * Response data for flashcard list with pagination
 */
export interface FlashcardsListResponseData {
  flashcards: FlashcardDto[];
  pagination: PaginationDto;
}

/**
 * Complete response for flashcard list
 */
export type FlashcardsListResponse = ApiResponse<FlashcardsListResponseData>;

// =============================================================================
// STUDY SESSION DTO TYPES
// =============================================================================

/**
 * Simplified flashcard data for study sessions
 */
export type StudyFlashcardDto = Pick<FlashcardDto, "id" | "front_text" | "back_text" | "due" | "difficulty" | "reps">;

/**
 * Response data for study session
 */
export interface StudySessionResponseData {
  session_id: string;
  flashcards: StudyFlashcardDto[];
  total_due: number;
  estimated_time_minutes: number;
}

/**
 * Complete response for study session
 */
export type StudySessionResponse = ApiResponse<StudySessionResponseData>;

/**
 * Individual item in review schedule
 */
export interface ScheduleItem {
  date: string; // ISO date
  count: number;
  flashcard_ids: string[];
}

/**
 * Response data for review schedule
 */
export interface ReviewScheduleResponseData {
  schedule: ScheduleItem[];
}

/**
 * Complete response for review schedule
 */
export type ReviewScheduleResponse = ApiResponse<ReviewScheduleResponseData>;

// =============================================================================
// REVIEW RECORD DTO TYPES
// =============================================================================

/**
 * Review record DTO for API responses - excludes sensitive fields
 */
export type ReviewRecordDto = Omit<Tables<"review_records">, "user_id" | "is_deleted">;

/**
 * Request body for submitting a review rating
 */
export interface SubmitReviewRequest {
  flashcard_id: string; // Required
  rating: ReviewRating; // 1-4, required
  session_id?: string; // Optional session tracking
}

/**
 * Response data for review submission with updated flashcard info
 */
export interface SubmitReviewResponseData {
  review_id: string;
  flashcard_id: string;
  rating: ReviewRating;
  next_due: string; // ISO timestamp
  updated_difficulty: number;
  updated_reps: number;
  created_at: string;
}

/**
 * Complete response for review submission
 */
export type SubmitReviewResponse = ApiResponse<SubmitReviewResponseData>;

/**
 * Response data for review history with pagination
 */
export interface ReviewHistoryResponseData {
  reviews: ReviewRecordDto[];
  pagination: PaginationDto;
}

/**
 * Complete response for review history
 */
export type ReviewHistoryResponse = ApiResponse<ReviewHistoryResponseData>;

// =============================================================================
// USER PROFILE DTO TYPES
// =============================================================================

/**
 * Statistics breakdown by flashcard source
 */
export interface FlashcardsBySource {
  "ai-full": number;
  "ai-edit": number;
  manual: number;
}

/**
 * User statistics aggregated data
 */
export interface UserStats {
  total_flashcards: number;
  flashcards_by_source: FlashcardsBySource;
  total_reviews: number;
  avg_rating: number;
}

/**
 * Response data for user profile
 */
export interface UserProfileResponseData {
  id: string;
  email: string;
  created_at: string;
  stats: UserStats;
}

/**
 * Complete response for user profile
 */
export type UserProfileResponse = ApiResponse<UserProfileResponseData>;

// =============================================================================
// ANALYTICS DTO TYPES
// =============================================================================

/**
 * Response data for AI generation analytics (admin only)
 */
export interface GenerationAnalyticsResponseData {
  total_generations: number;
  total_candidates: number;
  total_accepted: number;
  acceptance_rate: number;
  ai_vs_manual_ratio: number;
  avg_processing_time_ms: number;
  error_rate: number;
}

/**
 * Complete response for generation analytics
 */
export type GenerationAnalyticsResponse = ApiResponse<GenerationAnalyticsResponseData>;

// =============================================================================
// COMMAND MODEL TYPES (for internal use)
// =============================================================================

/**
 * Command model for creating flashcards - derived from database Insert type
 */
export type CreateFlashcardCommand = Required<
  Pick<TablesInsert<"flashcards">, "front_text" | "back_text" | "source" | "user_id">
> & {
  id?: string;
  candidate_id?: string;
};

/**
 * Command model for updating flashcards - derived from database Update type
 */
export type UpdateFlashcardCommand = Pick<
  TablesUpdate<"flashcards">,
  "front_text" | "back_text" | "source" | "updated_at"
> & {
  id: string;
  user_id: string;
};

/**
 * Command model for creating review records - derived from database Insert type
 */
export type CreateReviewCommand = Required<Pick<TablesInsert<"review_records">, "flashcard_id" | "rating" | "user_id">>;

/**
 * Command model for soft deleting flashcards
 */
export interface DeleteFlashcardCommand {
  id: string;
  user_id: string;
}

/**
 * Query parameters for flashcard list filtering
 */
export interface FlashcardListQuery {
  page?: number;
  limit?: number;
  source?: FlashcardSource;
  due_before?: string; // ISO timestamp
  sort?: "created_at" | "due" | "difficulty";
  order?: "asc" | "desc";
}

/**
 * Query parameters for review history filtering
 */
export interface ReviewHistoryQuery {
  flashcard_id?: string;
  page?: number;
  limit?: number;
  from_date?: string; // ISO date
  to_date?: string; // ISO date
}

/**
 * Query parameters for study session
 */
export interface StudySessionQuery {
  limit?: number; // Max 50
}

/**
 * Query parameters for review schedule
 */
export interface ReviewScheduleQuery {
  days_ahead?: number; // Max 30
}

/**
 * Query parameters for generation analytics
 */
export interface GenerationAnalyticsQuery {
  from_date?: string; // ISO date
  to_date?: string; // ISO date
}

// =============================================================================
// HASH AND DUPLICATE DETECTION TYPES
// =============================================================================

/**
 * Hash utilities for content deduplication
 */
export interface ContentHash {
  front_text_hash: string; // SHA-256 hash
  back_text_hash: string; // SHA-256 hash
}

/**
 * Duplicate check request for flashcards
 */
export interface CheckDuplicateRequest {
  front_text: string;
  back_text?: string; // Optional for similarity check
  user_id?: string; // Optional for user-specific check
}

/**
 * Duplicate check response
 */
export interface DuplicateCheckResponseData {
  is_duplicate: boolean;
  existing_flashcard_id?: string;
  similarity_score?: number; // 0-1 for content similarity
  duplicate_type: "exact" | "similar" | "none";
}

/**
 * Complete response for duplicate check
 */
export type DuplicateCheckResponse = ApiResponse<DuplicateCheckResponseData>;

/**
 * AI generation cache entry
 */
export interface AiGenerationCacheEntry {
  input_text_hash: string; // SHA-256 of input text
  candidates: AiCandidate[];
  generation_metadata: GenerationMetadata;
  cached_at: string; // ISO timestamp
  expires_at: string; // ISO timestamp
}

// =============================================================================
// TYPE GUARDS AND VALIDATION HELPERS
// =============================================================================

/**
 * Type guard to check if a value is a valid FlashcardSource
 */
export function isFlashcardSource(value: unknown): value is FlashcardSource {
  return typeof value === "string" && ["ai-full", "ai-edit", "manual"].includes(value);
}

/**
 * Type guard to check if a value is a valid ReviewRating
 */
export function isReviewRating(value: unknown): value is ReviewRating {
  return typeof value === "number" && [1, 2, 3, 4].includes(value);
}

/**
 * Type guard to check if a response is an error response
 */
export function isErrorResponse(response: ApiResponse | ErrorResponse): response is ErrorResponse {
  return !response.success;
}

/**
 * Configuration for AI model parameters
 */
export interface AiModelConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
}

/**
 * AI service error details
 */
export interface AiServiceError {
  code: "RATE_LIMIT" | "INVALID_REQUEST" | "MODEL_ERROR" | "TIMEOUT" | "UNKNOWN";
  message: string;
  is_retryable: boolean;
  retry_after?: number;
}

/**
 * OpenRouter API request structure
 */
export interface OpenRouterRequest {
  model: string;
  messages: {
    role: "system" | "user";
    content: string;
  }[];
  temperature: number;
  max_tokens: number;
  top_p: number;
}

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "DUPLICATE"
  | "RATE_LIMIT"
  | "AI_SERVICE_ERROR"
  | "NO_SESSION"
  | "TIMEOUT"
  | "UNKNOWN";

export interface SuccessResponse {
  success: true;
  message: string;
}

/**
 * Complete flashcard data - alias for FlashcardDto for consistency across codebase
 */
export type Flashcard = FlashcardDto;

/**
 * Response for single flashcard operations (GET, PUT)
 */
export type FlashcardResponse = ApiResponse<FlashcardDto>;

/**
 * Response data for flashcard list operations with metadata
 */
export interface FlashcardsResponseData {
  flashcards: FlashcardDto[];
  total: number;
  generated_count?: number; // For AI generation responses
  duplicate_count?: number; // For AI generation responses
}

/**
 * Complete response for flashcard list operations
 */
export type FlashcardsResponse = ApiResponse<FlashcardsResponseData>;

/**
 * Request for AI flashcard generation with specific parameters
 */
export interface GenerateFlashcardsRequest {
  topic: string; // Main topic for generation
  difficulty_level: "easy" | "medium" | "hard"; // Difficulty level
  count: number; // Number of flashcards to generate (1-10)
  category?: string; // Optional category
  additional_context?: string; // Optional additional context
}

// =============================================================================
// OPENROUTER SERVICE TYPES
// =============================================================================

/**
 * Configuration for OpenRouter service
 */
export interface OpenRouterServiceConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  baseDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

/**
 * JSON Schema for structured responses
 */
export interface JSONSchema {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: boolean;
}

/**
 * Flashcard generation request for OpenRouter
 */
export interface FlashcardGenerationRequest {
  topic: string;
  difficulty_level: "easy" | "medium" | "hard";
  count: number;
  category?: string;
  additional_context?: string;
  retry_count?: number; // For internal retry logic
}

/**
 * Individual flashcard in generation response
 */
export interface GeneratedFlashcard {
  front_text: string;
  back_text: string;
  difficulty: "easy" | "medium" | "hard";
  category?: string;
}

/**
 * Flashcard generation response
 */
export interface FlashcardGenerationResponse {
  flashcards: GeneratedFlashcard[];
  metadata: {
    model_used: string;
    processing_time_ms: number;
    retry_count: number;
  };
}

/**
 * OpenRouter API response structure
 */
export interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenRouter error types
 */
export interface OpenRouterError {
  code: ErrorCode;
  message: string;
  isRetryable: boolean;
  retryAfter?: number;
  details?: unknown;
}

/**
 * Error codes for OpenRouter service
 */
export type ErrorCode =
  | "NETWORK_ERROR"
  | "AUTHENTICATION_ERROR"
  | "RATE_LIMIT_ERROR"
  | "VALIDATION_ERROR"
  | "MODEL_ERROR"
  | "TIMEOUT_ERROR"
  | "UNKNOWN_ERROR";

/**
 * Circuit breaker states
 */
export enum CircuitBreakerState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

/**
 * Service status information
 */
export interface ServiceStatus {
  isHealthy: boolean;
  circuitBreakerState: CircuitBreakerState;
  lastError?: string;
  requestCount: number;
}

/**
 * Extended OpenRouter request with response format
 */
export interface OpenRouterRequestWithFormat extends OpenRouterRequest {
  response_format?: {
    type: "json_schema";
    json_schema: {
      name: string;
      strict: boolean;
      schema: JSONSchema;
    };
  };
}
