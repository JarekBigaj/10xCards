import type { SupabaseClient } from "../../db/supabase.client";
import type { Tables } from "../../db/database.types";
import type {
  FlashcardDto,
  FlashcardListQuery,
  ExtendedFlashcardListQuery,
  FlashcardsListResponseData,
  PaginationDto,
  CreateFlashcardCommand,
  CreateFlashcardsResponseData,
  FlashcardCreationError,
  ContentHash,
  UpdateFlashcardCommand,
  DeleteFlashcardCommand,
  FlashcardGenerationRequest,
  GeneratedFlashcard,
  BulkDeleteResponseData,
  BulkUpdateRequest,
  BulkUpdateResponseData,
  BulkOperationError,
  FlashcardStats,
} from "../../types";
import { generateContentHash } from "./duplicate-check.service";
import { createAiService } from "./ai.service";

/**
 * FlashcardService - handles flashcard data operations
 */
export class FlashcardService {
  private readonly aiService: ReturnType<typeof createAiService>;

  constructor(private supabase: SupabaseClient) {
    // Initialize AI service for generating flashcard proposals
    this.aiService = createAiService(import.meta.env.OPENROUTER_API_KEY); // Use OpenRouter by default
  }

  /**
   * Get user's flashcards with filtering, sorting, and pagination
   */
  async getFlashcards(userId: string, query: FlashcardListQuery): Promise<FlashcardsListResponseData> {
    try {
      // Build the base query
      let supabaseQuery = this.supabase
        .from("flashcards")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_deleted", false);

      // Apply filters
      if (query.source) {
        supabaseQuery = supabaseQuery.eq("source", query.source);
      }

      if (query.due_before) {
        supabaseQuery = supabaseQuery.lte("due", query.due_before);
      }

      // Apply sorting
      const sortField = query.sort || "created_at";
      const sortOrder = query.order || "desc";
      const ascending = sortOrder === "asc";

      supabaseQuery = supabaseQuery.order(sortField, { ascending });

      // Apply pagination
      const page = query.page || 1;
      const limit = query.limit || 20;
      const offset = (page - 1) * limit;

      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      // Execute query
      const { data, error, count } = await supabaseQuery;

      if (error) {
        throw new Error(`Failed to fetch flashcards: ${error.message}`);
      }

      // Calculate pagination metadata
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      const pagination: PaginationDto = {
        current_page: page,
        total_pages: totalPages,
        total_count: totalCount,
        limit: limit,
      };

      // Transform data to DTOs (remove user_id, is_deleted, and hash fields)
      const flashcards: FlashcardDto[] = (data || []).map((flashcard) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user_id, is_deleted, front_text_hash, back_text_hash, ...flashcardDto } = flashcard;
        return flashcardDto;
      });

      return {
        flashcards,
        pagination,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unknown error occurred while fetching flashcards");
    }
  }

  /**
   * Get user's flashcards with extended filtering, search, and pagination
   */
  async getFlashcardsExtended(userId: string, query: ExtendedFlashcardListQuery): Promise<FlashcardsListResponseData> {
    try {
      // Build the base query
      let supabaseQuery = this.supabase
        .from("flashcards")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .eq("is_deleted", false);

      // Apply basic filters (from base FlashcardListQuery)
      if (query.source) {
        supabaseQuery = supabaseQuery.eq("source", query.source);
      }

      if (query.due_before) {
        supabaseQuery = supabaseQuery.lte("due", query.due_before);
      }

      // Apply extended filters
      if (query.created_after) {
        supabaseQuery = supabaseQuery.gte("created_at", query.created_after);
      }

      if (query.created_before) {
        supabaseQuery = supabaseQuery.lte("created_at", query.created_before);
      }

      if (query.difficulty_min !== undefined) {
        supabaseQuery = supabaseQuery.gte("difficulty", query.difficulty_min);
      }

      if (query.difficulty_max !== undefined) {
        supabaseQuery = supabaseQuery.lte("difficulty", query.difficulty_max);
      }

      if (query.reps_min !== undefined) {
        supabaseQuery = supabaseQuery.gte("reps", query.reps_min);
      }

      if (query.reps_max !== undefined) {
        supabaseQuery = supabaseQuery.lte("reps", query.reps_max);
      }

      if (query.never_reviewed) {
        supabaseQuery = supabaseQuery.eq("reps", 0);
      }

      if (query.due_only) {
        const now = new Date().toISOString();
        supabaseQuery = supabaseQuery.lte("due", now);
      }

      // Apply full-text search if provided
      if (query.search) {
        // Note: We're using simple text search here. For production, consider adding
        // a full-text search index for better performance
        supabaseQuery = supabaseQuery.or(`front_text.ilike.%${query.search}%,back_text.ilike.%${query.search}%`);
      }

      // Apply sorting
      const sortField = query.sort || "created_at";
      const sortOrder = query.order || "desc";
      const ascending = sortOrder === "asc";

      supabaseQuery = supabaseQuery.order(sortField, { ascending });

      // Apply pagination
      const page = query.page || 1;
      const limit = Math.min(query.limit || 20, 100); // Limit max results to 100
      const offset = (page - 1) * limit;

      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      // Execute query
      const { data, error, count } = await supabaseQuery;

      if (error) {
        throw new Error(`Failed to fetch flashcards: ${error.message}`);
      }

      // Calculate pagination metadata
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / limit);

      const pagination: PaginationDto = {
        current_page: page,
        total_pages: totalPages,
        total_count: totalCount,
        limit: limit,
      };

      // Transform data to DTOs (remove user_id, is_deleted, and hash fields)
      const flashcards: FlashcardDto[] = (data || []).map((flashcard) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user_id, is_deleted, front_text_hash, back_text_hash, ...flashcardDto } = flashcard;
        return flashcardDto;
      });

      return {
        flashcards,
        pagination,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unknown error occurred while fetching flashcards");
    }
  }

  /**
   * Generate content hashes for flashcard text
   */
  private generateFlashcardHashes(frontText: string, backText: string): ContentHash {
    return {
      front_text_hash: generateContentHash(frontText),
      back_text_hash: generateContentHash(backText),
    };
  }

  /**
   * Check if flashcard is duplicate based on front text hash
   */
  private async checkDuplicateByHash(userId: string, frontTextHash: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("id")
      .eq("user_id", userId)
      .eq("front_text_hash", frontTextHash)
      .eq("is_deleted", false)
      .limit(1);

    if (error) {
      throw new Error(`Failed to check for duplicates: ${error.message}`);
    }

    return data && data.length > 0;
  }

  /**
   * Transform database record to DTO
   */
  private transformToDto(flashcard: Tables<"flashcards">): FlashcardDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, is_deleted, front_text_hash, back_text_hash, ...flashcardDto } = flashcard;
    return flashcardDto;
  }

  /**
   * Create a single flashcard
   */
  async createFlashcard(command: CreateFlashcardCommand): Promise<FlashcardDto> {
    try {
      // Generate content hashes
      const hashes = this.generateFlashcardHashes(command.front_text, command.back_text);

      // Check for duplicates
      const isDuplicate = await this.checkDuplicateByHash(command.user_id, hashes.front_text_hash);
      if (isDuplicate) {
        throw new Error("DUPLICATE");
      }

      // Prepare insert data
      const insertData = {
        id: command.id,
        front_text: command.front_text,
        back_text: command.back_text,
        source: command.source,
        user_id: command.user_id,
        front_text_hash: hashes.front_text_hash,
        back_text_hash: hashes.back_text_hash,
        due: new Date().toISOString(),
        scheduled_days: 0,
        difficulty: 2.5,
        reps: 0,
      };

      // Insert flashcard
      const { data, error } = await this.supabase.from("flashcards").insert(insertData).select().single();

      if (error) {
        throw new Error(`Failed to create flashcard: ${error.message}`);
      }

      return this.transformToDto(data);
    } catch (error) {
      if (error instanceof Error && error.message === "DUPLICATE") {
        throw error;
      }
      throw new Error("Failed to create flashcard");
    }
  }

  /**
   * Create multiple flashcards with batch processing
   */
  async createFlashcards(commands: CreateFlashcardCommand[]): Promise<CreateFlashcardsResponseData> {
    try {
      const results: FlashcardDto[] = [];
      const errors: FlashcardCreationError[] = [];

      // Process each flashcard
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        try {
          const flashcard = await this.createFlashcard(command);
          results.push(flashcard);
        } catch (error) {
          let errorCode: "DUPLICATE" | "VALIDATION_ERROR" = "VALIDATION_ERROR";
          let errorMessage = "Failed to create flashcard";

          if (error instanceof Error) {
            if (error.message === "DUPLICATE") {
              errorCode = "DUPLICATE";
              errorMessage = "Flashcard with this front text already exists";
            } else {
              errorMessage = error.message;
            }
          }

          errors.push({
            index: i,
            front_text: command.front_text,
            error: errorMessage,
            code: errorCode,
          });
        }
      }

      return {
        created_count: results.length,
        failed_count: errors.length,
        flashcards: results,
        errors,
      };
    } catch {
      throw new Error("Failed to process flashcard creation batch");
    }
  }

  /**
   * Get a single flashcard by ID and user ID
   */
  async getFlashcardById(flashcardId: string, userId: string): Promise<FlashcardDto | null> {
    try {
      const { data, error } = await this.supabase
        .from("flashcards")
        .select("*")
        .eq("id", flashcardId)
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        throw new Error(`Failed to fetch flashcard: ${error.message}`);
      }

      return this.transformToDto(data);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unknown error occurred while fetching flashcard");
    }
  }

  /**
   * Check if flashcard with front text hash exists for user (excluding specific flashcard ID)
   */
  private async checkDuplicateByHashExcluding(
    userId: string,
    frontTextHash: string,
    excludeId: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("id")
      .eq("user_id", userId)
      .eq("front_text_hash", frontTextHash)
      .eq("is_deleted", false)
      .neq("id", excludeId)
      .limit(1);

    if (error) {
      throw new Error(`Failed to check for duplicates: ${error.message}`);
    }

    return data && data.length > 0;
  }

  /**
   * Update an existing flashcard
   */
  async updateFlashcard(flashcardId: string, command: UpdateFlashcardCommand, userId: string): Promise<FlashcardDto> {
    try {
      // Step 1: Check if flashcard exists and belongs to user
      const existingFlashcard = await this.getFlashcardById(flashcardId, userId);
      if (!existingFlashcard) {
        throw new Error("NOT_FOUND");
      }

      // Step 2: Prepare update data with current values as defaults
      const updateData: {
        source: "ai-edit" | "manual";
        updated_at: string;
        front_text?: string;
        front_text_hash?: string;
        back_text?: string;
        back_text_hash?: string;
      } = {
        source: command.source as "ai-edit" | "manual",
        updated_at: new Date().toISOString(),
      };

      // Step 3: Handle front_text update and duplicate check
      if (command.front_text !== undefined) {
        const frontTextHash = generateContentHash(command.front_text);

        // Only check for duplicate if front_text actually changed
        if (command.front_text !== existingFlashcard.front_text) {
          const isDuplicate = await this.checkDuplicateByHashExcluding(userId, frontTextHash, flashcardId);
          if (isDuplicate) {
            throw new Error("DUPLICATE");
          }
        }

        updateData.front_text = command.front_text;
        updateData.front_text_hash = frontTextHash;
      }

      // Step 4: Handle back_text update
      if (command.back_text !== undefined) {
        updateData.back_text = command.back_text;
        updateData.back_text_hash = generateContentHash(command.back_text);
      }

      // Step 5: Update flashcard in database
      const { data, error } = await this.supabase
        .from("flashcards")
        .update(updateData)
        .eq("id", flashcardId)
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update flashcard: ${error.message}`);
      }

      return this.transformToDto(data);
    } catch (error) {
      if (error instanceof Error && (error.message === "NOT_FOUND" || error.message === "DUPLICATE")) {
        throw error;
      }
      throw new Error("Failed to update flashcard");
    }
  }

  /**
   * Soft delete a flashcard (set is_deleted = true)
   */
  async deleteFlashcard(command: DeleteFlashcardCommand): Promise<void> {
    try {
      // Using authenticated client with RLS policies

      // First check if flashcard exists and belongs to user (like in bulk delete)
      const existingFlashcard = await this.getFlashcardById(command.id, command.user_id);
      if (!existingFlashcard) {
        throw new Error("NOT_FOUND");
      }

      // Perform soft delete using update query
      const { error } = await this.supabase
        .from("flashcards")
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq("id", command.id)
        .eq("user_id", command.user_id)
        .eq("is_deleted", false); // Only update if not already deleted

      if (error) {
        throw new Error(`Failed to delete flashcard: ${error.message}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message === "NOT_FOUND") {
        throw error;
      }
      throw new Error("Failed to delete flashcard");
    }
  }

  /**
   * Generate flashcard proposals using AI service
   */
  async generateFlashcardProposals(request: FlashcardGenerationRequest): Promise<{
    proposals: GeneratedFlashcard[];
    metadata: {
      model_used: string;
      processing_time_ms: number;
      retry_count: number;
    };
  }> {
    try {
      // Use AI service to generate flashcard proposals
      const result = await this.aiService.generateCustomCandidates(request);

      // Convert AiCandidate format to GeneratedFlashcard format
      const proposals: GeneratedFlashcard[] = result.candidates.map((candidate) => ({
        front_text: candidate.front_text,
        back_text: candidate.back_text,
        difficulty: candidate.difficulty, // Preserve AI-generated difficulty
        category: candidate.category, // Preserve AI-generated category
      }));

      return {
        proposals,
        metadata: {
          ...result.metadata,
          retry_count: request.retry_count || 0,
        },
      };
    } catch (error) {
      // If AI service fails, throw a user-friendly error
      if (error instanceof Error) {
        throw new Error(`Failed to generate flashcard proposals: ${error.message}`);
      }

      throw new Error("Failed to generate flashcard proposals");
    }
  }

  /**
   * Generate flashcard proposals from text input (simplified interface)
   */
  async generateProposalsFromText(
    text: string,
    userId: string,
    options?: {
      difficulty_level?: "easy" | "medium" | "hard";
      count?: number;
      category?: string;
      retry_count?: number;
    }
  ): Promise<{
    proposals: GeneratedFlashcard[];
    metadata: {
      model_used: string;
      processing_time_ms: number;
      retry_count: number;
    };
  }> {
    // Generate a concise topic from the text (max 200 chars for OpenRouter)
    const topic = this.generateTopicFromText(text);

    // Verify topic length is within limits
    if (topic.length > 200) {
      throw new Error(`Generated topic is too long: ${topic.length} characters (max 200)`);
    }

    // Prepare additional_context (max 1000 chars for OpenRouter)
    // Ensure we leave space for ellipsis if needed
    const maxContextLength = 997; // 1000 - 3 for "..." if needed
    const additionalContext = text.length > maxContextLength ? text.substring(0, maxContextLength) + "..." : text;

    // Verify additional_context length is within limits
    if (additionalContext.length > 1000) {
      throw new Error(`Additional context exceeds 1000 characters: ${additionalContext.length} characters (max 1000)`);
    }

    const request: FlashcardGenerationRequest = {
      topic,
      difficulty_level: options?.difficulty_level || "medium",
      count: options?.count || 5,
      category: options?.category,
      additional_context: additionalContext, // Use truncated text as additional context
      retry_count: options?.retry_count || 0,
    };

    return this.generateFlashcardProposals(request);
  }

  /**
   * Generate a concise topic from input text (max 200 chars)
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

  /**
   * Get AI service status and metrics
   */
  getAiServiceStatus() {
    return {
      openRouterStatus: this.aiService.getOpenRouterStatus(),
      openRouterMetrics: this.aiService.getOpenRouterMetrics(),
    };
  }

  // =============================================================================
  // BULK OPERATIONS
  // =============================================================================

  /**
   * Bulk delete multiple flashcards (soft delete)
   */
  async bulkDeleteFlashcards(userId: string, flashcardIds: string[]): Promise<BulkDeleteResponseData> {
    try {
      const results: { deleted_count: number; failed_count: number; errors: BulkOperationError[] } = {
        deleted_count: 0,
        failed_count: 0,
        errors: [],
      };

      // Process each flashcard ID
      for (const flashcardId of flashcardIds) {
        try {
          // Check if flashcard exists and belongs to user
          const existingFlashcard = await this.getFlashcardById(flashcardId, userId);
          if (!existingFlashcard) {
            results.failed_count++;
            results.errors.push({
              flashcard_id: flashcardId,
              error: "Flashcard not found",
              code: "NOT_FOUND",
            });
            continue;
          }

          // Perform soft delete
          const { error } = await this.supabase
            .from("flashcards")
            .update({
              is_deleted: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", flashcardId)
            .eq("user_id", userId)
            .eq("is_deleted", false);

          if (error) {
            results.failed_count++;
            results.errors.push({
              flashcard_id: flashcardId,
              error: `Database error: ${error.message}`,
              code: "VALIDATION_ERROR",
            });
          } else {
            results.deleted_count++;
          }
        } catch (error) {
          results.failed_count++;
          results.errors.push({
            flashcard_id: flashcardId,
            error: error instanceof Error ? error.message : "Unknown error",
            code: "VALIDATION_ERROR",
          });
        }
      }

      return results;
    } catch {
      throw new Error("Failed to process bulk delete operation");
    }
  }

  /**
   * Bulk update multiple flashcards
   */
  async bulkUpdateFlashcards(userId: string, updates: BulkUpdateRequest["updates"]): Promise<BulkUpdateResponseData> {
    try {
      const results: {
        updated_count: number;
        failed_count: number;
        flashcards: FlashcardDto[];
        errors: BulkOperationError[];
      } = {
        updated_count: 0,
        failed_count: 0,
        flashcards: [],
        errors: [],
      };

      // Process each update
      for (const update of updates) {
        try {
          // Create update command
          const command: UpdateFlashcardCommand = {
            id: update.id,
            user_id: userId,
            front_text: update.front_text,
            back_text: update.back_text,
            source: update.source,
            updated_at: new Date().toISOString(),
          };

          const updatedFlashcard = await this.updateFlashcard(update.id, command, userId);
          results.updated_count++;
          results.flashcards.push(updatedFlashcard);
        } catch (error) {
          results.failed_count++;

          let errorCode: BulkOperationError["code"] = "VALIDATION_ERROR";
          let errorMessage = "Failed to update flashcard";

          if (error instanceof Error) {
            if (error.message === "NOT_FOUND") {
              errorCode = "NOT_FOUND";
              errorMessage = "Flashcard not found";
            } else if (error.message === "DUPLICATE") {
              errorCode = "DUPLICATE";
              errorMessage = "Flashcard with this front text already exists";
            } else {
              errorMessage = error.message;
            }
          }

          results.errors.push({
            flashcard_id: update.id,
            error: errorMessage,
            code: errorCode,
          });
        }
      }

      return results;
    } catch {
      throw new Error("Failed to process bulk update operation");
    }
  }

  // =============================================================================
  // STATISTICS
  // =============================================================================

  /**
   * Get comprehensive flashcard statistics for a user
   */
  async getFlashcardStats(userId: string): Promise<FlashcardStats> {
    try {
      // Get all flashcards for the user (without pagination)
      const { data: flashcards, error } = await this.supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", userId)
        .eq("is_deleted", false);

      if (error) {
        throw new Error(`Failed to fetch flashcard statistics: ${error.message}`);
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Initialize statistics
      const stats: FlashcardStats = {
        total_count: flashcards?.length || 0,
        by_source: {
          "ai-full": 0,
          "ai-edit": 0,
          manual: 0,
        },
        by_difficulty: {
          easy: 0,
          medium: 0,
          hard: 0,
        },
        due_today: 0,
        due_this_week: 0,
        overdue: 0,
        never_reviewed: 0,
        avg_difficulty: 0,
        total_reviews: 0,
        created_this_month: 0,
        longest_streak: 0,
      };

      if (!flashcards || flashcards.length === 0) {
        return stats;
      }

      // Calculate statistics
      let totalDifficulty = 0;

      for (const flashcard of flashcards) {
        // Count by source
        (stats.by_source as unknown as Record<string, number>)[flashcard.source]++;

        // Count by difficulty
        if (flashcard.difficulty <= 2) {
          stats.by_difficulty.easy++;
        } else if (flashcard.difficulty <= 4) {
          stats.by_difficulty.medium++;
        } else {
          stats.by_difficulty.hard++;
        }

        // Accumulate difficulty for average
        totalDifficulty += flashcard.difficulty;

        // Count total reviews
        stats.total_reviews += flashcard.reps;

        // Check if never reviewed
        if (flashcard.reps === 0) {
          stats.never_reviewed++;
        }

        // Check due dates
        const dueDate = new Date(flashcard.due);
        const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        if (dueDate <= todayEnd) {
          stats.due_today++;
        }

        if (dueDate <= oneWeekFromNow) {
          stats.due_this_week++;
        }

        if (dueDate < today) {
          stats.overdue++;
        }

        // Check creation date
        const createdDate = new Date(flashcard.created_at);
        if (createdDate >= thisMonthStart) {
          stats.created_this_month++;
        }
      }

      // Calculate average difficulty
      stats.avg_difficulty = Math.round((totalDifficulty / flashcards.length) * 100) / 100;

      // For longest streak, we would need review_records table
      // For now, set to 0 as placeholder
      stats.longest_streak = 0;

      return stats;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unknown error occurred while fetching statistics");
    }
  }
}
