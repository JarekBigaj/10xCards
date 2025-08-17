import type { APIRoute } from "astro";
import {
  CheckDuplicateRequestSchema,
  formatFlashcardValidationErrors,
} from "../../../lib/validation/flashcard-schemas";
import { checkDuplicate } from "../../../lib/services/duplicate-check.service";
import { requireAuth } from "../../../lib/utils/auth";
import type { CheckDuplicateRequest, DuplicateCheckResponse, ErrorResponse } from "../../../types";

export const prerender = false;

/**
 * POST /api/flashcards/check-duplicate
 * Check if a flashcard with similar content already exists
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    const authResult = await requireAuth(locals);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { userId } = authResult;

    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: "Invalid JSON in request body",
        details: [
          {
            code: "VALIDATION_ERROR",
            message: "Request body must be valid JSON" + parseError,
          },
        ],
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request data with Zod schema
    const validationResult = CheckDuplicateRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: "Validation failed",
        details: formatFlashcardValidationErrors(validationResult.error),
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedRequest: CheckDuplicateRequest = validationResult.data;

    // Validate user_id if provided - must match authenticated user
    if (validatedRequest.user_id && validatedRequest.user_id !== userId) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: "Invalid user_id - must match authenticated user",
        details: [
          {
            field: "user_id",
            code: "VALIDATION_ERROR",
            message: "user_id must match the authenticated user's ID",
          },
        ],
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check for duplicates using the service
    const duplicateCheckResult = await checkDuplicate(locals.supabase, validatedRequest, userId);

    // Return successful response
    const successResponse: DuplicateCheckResponse = {
      success: true,
      data: duplicateCheckResult,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("Database error")) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: "Database operation failed",
          details: [
            {
              code: "VALIDATION_ERROR",
              message: "Unable to check for duplicates at this time",
            },
          ],
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Generic server error
    const errorResponse: ErrorResponse = {
      success: false,
      error: "Internal server error",
      details: [
        {
          code: "UNKNOWN",
          message: "An unexpected error occurred while checking for duplicates",
        },
      ],
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
