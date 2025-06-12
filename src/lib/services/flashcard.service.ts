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
} from "../../types";
import { generateContentHash } from "./duplicate-check.service";

/**
 * FlashcardService - handles flashcard data operations
 */
export class FlashcardService {
  constructor(private supabase: SupabaseClient) {}

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
      const updateData: any = {
        source: command.source,
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
}
