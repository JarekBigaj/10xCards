import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService } from "../../lib/services/flashcard.service";
import { requireAuth } from "../../lib/utils/auth";
import {
  FlashcardListQuerySchema,
  ExtendedFlashcardListQuerySchema,
  formatFlashcardValidationErrors,
  CreateFlashcardRequestSchema,
  CreateFlashcardsRequestSchema,
} from "../../lib/validation/flashcard-schemas";
import type {
  FlashcardsListResponse,
  ErrorResponse,
  FlashcardListQuery,
  ExtendedFlashcardListQuery,
  CreateFlashcardRequest,
  CreateFlashcardsRequest,
  CreateFlashcardResponse,
  CreateFlashcardsResponse,
  CreateFlashcardCommand,
} from "../../types";

export const prerender = false;

/**
 * GET /api/flashcards
 * Retrieve user's flashcards with filtering, sorting, and pagination
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const authResult = await requireAuth(locals);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { userId } = authResult;
    const supabase = locals.supabase;

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Check if any extended search parameters are present
    const hasExtendedParams = [
      "search",
      "created_after",
      "created_before",
      "difficulty_min",
      "difficulty_max",
      "reps_min",
      "reps_max",
      "never_reviewed",
      "due_only",
    ].some((param) => queryParams[param] !== undefined);

    let validatedQuery: FlashcardListQuery | ExtendedFlashcardListQuery;
    try {
      if (hasExtendedParams) {
        validatedQuery = ExtendedFlashcardListQuerySchema.parse(queryParams);
      } else {
        validatedQuery = FlashcardListQuerySchema.parse(queryParams);
      }
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
    const result = hasExtendedParams
      ? await flashcardService.getFlashcardsExtended(userId, validatedQuery as ExtendedFlashcardListQuery)
      : await flashcardService.getFlashcards(userId, validatedQuery as FlashcardListQuery);

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

/**
 * POST /api/flashcards
 * Create single or multiple flashcards
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const authResult = await requireAuth(locals);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { userId } = authResult;
    const supabase = locals.supabase;

    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (_error) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: "Invalid JSON in request body",
      };
      console.error("Error in POST /api/flashcards:", _error);
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body structure
    let validatedRequest: CreateFlashcardRequest | CreateFlashcardsRequest;
    let isBatchRequest = false;

    try {
      // Try to parse as batch request first
      if (typeof requestBody === "object" && requestBody !== null && "flashcards" in requestBody) {
        validatedRequest = CreateFlashcardsRequestSchema.parse(requestBody);
        isBatchRequest = true;
      } else {
        // Parse as single flashcard request
        validatedRequest = CreateFlashcardRequestSchema.parse(requestBody);
        isBatchRequest = false;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = formatFlashcardValidationErrors(error);
        const errorResponse: ErrorResponse = {
          success: false,
          error: "Validation failed",
          details: validationErrors,
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    // Initialize service
    const flashcardService = new FlashcardService(supabase);

    if (isBatchRequest) {
      // Handle batch creation
      const batchRequest = validatedRequest as CreateFlashcardsRequest;

      // Convert requests to commands
      const commands: CreateFlashcardCommand[] = batchRequest.flashcards.map((req) => ({
        front_text: req.front_text,
        back_text: req.back_text,
        source: req.source,
        user_id: userId,
        candidate_id: req.candidate_id,
      }));

      const result = await flashcardService.createFlashcards(commands);

      // Determine response status
      let statusCode = 201;
      if (result.failed_count > 0) {
        statusCode = result.created_count > 0 ? 207 : 400; // Multi-Status or Bad Request
      }

      const successResponse: CreateFlashcardsResponse = {
        success: true,
        data: result,
      };

      return new Response(JSON.stringify(successResponse), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Handle single flashcard creation
      const singleRequest = validatedRequest as CreateFlashcardRequest;

      const command: CreateFlashcardCommand = {
        front_text: singleRequest.front_text,
        back_text: singleRequest.back_text,
        source: singleRequest.source,
        user_id: userId,
        candidate_id: singleRequest.candidate_id,
      };

      try {
        const result = await flashcardService.createFlashcard(command);

        const successResponse: CreateFlashcardResponse = {
          success: true,
          data: result,
        };

        return new Response(JSON.stringify(successResponse), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        if (error instanceof Error && error.message === "DUPLICATE") {
          const errorResponse: ErrorResponse = {
            success: false,
            error: "Flashcard with this front text already exists",
            details: [
              {
                field: "front_text",
                code: "DUPLICATE",
                message: "A flashcard with this front text already exists",
              },
            ],
          };
          return new Response(JSON.stringify(errorResponse), {
            status: 409,
            headers: { "Content-Type": "application/json" },
          });
        }
        throw error;
      }
    }
  } catch (error) {
    console.error("Error in POST /api/flashcards:", error);

    // Handle specific error types
    let errorMessage = "Internal server error";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for payload size errors
      if (error.message.includes("Payload Too Large") || error.message.includes("413")) {
        statusCode = 413;
        errorMessage = "Request payload too large";
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
