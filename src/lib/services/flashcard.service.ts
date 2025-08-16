import type { SupabaseClient } from "../../db/supabase.client";
import type { Tables } from "../../db/database.types";
import type {
  FlashcardDto,
  FlashcardListQuery,
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
        console.error("Database error in getFlashcards:", error);
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
      console.error("Error in FlashcardService.getFlashcards:", error);
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
      console.error("Error checking duplicate:", error);
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
        console.error("Database error in createFlashcard:", error);
        throw new Error(`Failed to create flashcard: ${error.message}`);
      }

      return this.transformToDto(data);
    } catch (error) {
      console.error("Error in FlashcardService.createFlashcard:", error);
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
    } catch (error) {
      console.error("Error in FlashcardService.createFlashcards:", error);
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
        console.error("Database error in getFlashcardById:", error);
        throw new Error(`Failed to fetch flashcard: ${error.message}`);
      }

      return this.transformToDto(data);
    } catch (error) {
      console.error("Error in FlashcardService.getFlashcardById:", error);
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
      console.error("Error checking duplicate excluding ID:", error);
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
        console.error("Database error in updateFlashcard:", error);
        throw new Error(`Failed to update flashcard: ${error.message}`);
      }

      return this.transformToDto(data);
    } catch (error) {
      console.error("Error in FlashcardService.updateFlashcard:", error);
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
      // Step 1: Check if flashcard exists and belongs to user
      const existingFlashcard = await this.getFlashcardById(command.id, command.user_id);
      if (!existingFlashcard) {
        throw new Error("NOT_FOUND");
      }

      // Step 2: Perform soft delete - set is_deleted = true
      const { error } = await this.supabase
        .from("flashcards")
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", command.id)
        .eq("user_id", command.user_id)
        .eq("is_deleted", false); // Only delete if not already deleted

      if (error) {
        console.error("Database error in deleteFlashcard:", error);
        throw new Error(`Failed to delete flashcard: ${error.message}`);
      }

      // Note: We don't check affected rows since RLS ensures proper access control
      // and we already verified existence above

      // Log successful deletion for audit purposes
      console.log(`Flashcard deleted successfully: ${command.id} by user: ${command.user_id}`);
    } catch (error) {
      console.error("Error in FlashcardService.deleteFlashcard:", error);
      if (error instanceof Error && error.message === "NOT_FOUND") {
        throw error;
      }
      throw new Error("Failed to delete flashcard");
    }
  }

  /**
   * Generate flashcard proposals using AI service
   */
  async generateFlashcardProposals(
    request: FlashcardGenerationRequest,
    userId: string
  ): Promise<{
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
      console.error("Error in FlashcardService.generateFlashcardProposals:", error);

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

    // Log the generated topic for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log("Generated topic length:", topic.length);
      console.log("Generated topic:", topic);
      console.log("Full text length:", text.length);
    }

    // Verify topic length is within limits
    if (topic.length > 200) {
      console.error("ERROR: Generated topic exceeds 200 characters:", topic.length);
      throw new Error(`Generated topic is too long: ${topic.length} characters (max 200)`);
    }

    // Prepare additional_context (max 1000 chars for OpenRouter)
    // Ensure we leave space for ellipsis if needed
    const maxContextLength = 997; // 1000 - 3 for "..." if needed
    const additionalContext = text.length > maxContextLength ? text.substring(0, maxContextLength) + "..." : text;

    // Verify additional_context length is within limits
    if (additionalContext.length > 1000) {
      console.error("ERROR: Additional context exceeds 1000 characters:", additionalContext.length);
      throw new Error(`Additional context is too long: ${additionalContext.length} characters (max 1000)`);
    }

    // Log additional context for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log("Additional context length:", additionalContext.length);
      console.log("Additional context preview:", additionalContext.substring(0, 100) + "...");
    }

    const request: FlashcardGenerationRequest = {
      topic,
      difficulty_level: options?.difficulty_level || "medium",
      count: options?.count || 5,
      category: options?.category,
      additional_context: additionalContext, // Use truncated text as additional context
      retry_count: options?.retry_count || 0,
    };

    return this.generateFlashcardProposals(request, userId);
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
    let truncated = text.substring(0, maxLength);

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
}
