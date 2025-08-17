import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService } from "../../../lib/services/flashcard.service";
import { requireAuth } from "../../../lib/utils/auth";
import {
  BulkDeleteRequestSchema,
  BulkUpdateRequestSchema,
  formatFlashcardValidationErrors,
} from "../../../lib/validation/flashcard-schemas";
import type {
  BulkDeleteRequest,
  BulkUpdateRequest,
  BulkDeleteResponse,
  BulkUpdateResponse,
  ErrorResponse,
} from "../../../types";

export const prerender = false;

/**
 * DELETE /api/flashcards/bulk
 * Bulk delete multiple flashcards (soft delete)
 */
export const DELETE: APIRoute = async ({ request, locals }) => {
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
        error: "Invalid JSON in request body" + _error,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body
    let validatedRequest: BulkDeleteRequest;
    try {
      validatedRequest = BulkDeleteRequestSchema.parse(requestBody);
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

    // Initialize service and perform bulk delete
    const flashcardService = new FlashcardService(supabase);
    const result = await flashcardService.bulkDeleteFlashcards(userId, validatedRequest.flashcard_ids);

    // Return successful response
    const successResponse: BulkDeleteResponse = {
      success: true,
      data: result,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error types
    let errorMessage = "Internal server error";
    const statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
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
 * PUT /api/flashcards/bulk
 * Bulk update multiple flashcards
 */
export const PUT: APIRoute = async ({ request, locals }) => {
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
        error: "Invalid JSON in request body" + _error,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body
    let validatedRequest: BulkUpdateRequest;
    try {
      validatedRequest = BulkUpdateRequestSchema.parse(requestBody);
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

    // Initialize service and perform bulk update
    const flashcardService = new FlashcardService(supabase);
    const result = await flashcardService.bulkUpdateFlashcards(userId, validatedRequest.updates);

    // Determine response status
    let statusCode = 200;
    if (result.failed_count > 0) {
      statusCode = result.updated_count > 0 ? 207 : 400; // Multi-Status or Bad Request
    }

    // Return successful response
    const successResponse: BulkUpdateResponse = {
      success: true,
      data: result,
    };

    return new Response(JSON.stringify(successResponse), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific error types
    let errorMessage = "Internal server error";
    const statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
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
