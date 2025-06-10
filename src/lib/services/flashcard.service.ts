import type { SupabaseClient } from "../../db/supabase.client";
import type { FlashcardDto, FlashcardListQuery, FlashcardsListResponseData, PaginationDto } from "../../types";

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
}
