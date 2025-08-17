import type { APIRoute } from "astro";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import { requireAuth } from "../../../lib/utils/auth";
import type { FlashcardStatsResponse, ErrorResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/flashcards/stats
 * Get comprehensive flashcard statistics for the authenticated user
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Check authentication
    const authResult = await requireAuth(locals);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { userId } = authResult;
    const supabase = locals.supabase;

    // Initialize service and fetch statistics
    const flashcardService = new FlashcardService(supabase);
    const stats = await flashcardService.getFlashcardStats(userId);

    // Return successful response
    const successResponse: FlashcardStatsResponse = {
      success: true,
      data: {
        stats,
      },
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/flashcards/stats:", error);

    // Handle specific error types
    let errorMessage = "Internal server error";
    let statusCode = 500;

    if (error instanceof Error) {
      // Check for database connection errors
      if (error.message.includes("Failed to fetch flashcard statistics")) {
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
