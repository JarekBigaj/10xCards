import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService } from "../../lib/services/flashcard.service";
import { FlashcardListQuerySchema, formatFlashcardValidationErrors } from "../../lib/validation/flashcard-schemas";
import type { FlashcardsListResponse, ErrorResponse, FlashcardListQuery, ApiError } from "../../types";

export const prerender = false;

/**
 * GET /api/flashcards
 * Retrieve user's flashcards with filtering, sorting, and pagination
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const supabase = locals.supabase;
    if (!supabase) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: "Supabase client not available",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: "Authentication required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    let validatedQuery: FlashcardListQuery;
    try {
      validatedQuery = FlashcardListQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = formatFlashcardValidationErrors(error);
        const errorResponse: ErrorResponse = {
          success: false,
          error: "Invalid query parameters",
          details: validationErrors,
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    // Initialize service and fetch flashcards
    const flashcardService = new FlashcardService(supabase);
    const result = await flashcardService.getFlashcards(user.id, validatedQuery);

    // Return successful response
    const successResponse: FlashcardsListResponse = {
      success: true,
      data: result,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/flashcards:", error);

    // Handle specific error types
    let errorMessage = "Internal server error";
    let statusCode = 500;

    if (error instanceof Error) {
      // Check for database connection errors
      if (error.message.includes("Failed to fetch flashcards")) {
        errorMessage = "Database error occurred";
        statusCode = 500;
      } else {
        errorMessage = error.message;
      }
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: errorMessage,
    };

    return new Response(JSON.stringify(errorResponse), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
};
