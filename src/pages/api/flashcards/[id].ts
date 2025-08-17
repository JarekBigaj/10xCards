import type { APIRoute } from "astro";
import { z } from "zod";

import { FlashcardService } from "../../../lib/services/flashcard.service";
import { requireAuth } from "../../../lib/utils/auth";
import {
  UuidPathParamSchema,
  UpdateFlashcardRequestSchema,
  formatFlashcardValidationErrors,
} from "../../../lib/validation/flashcard-schemas";
import { createServerErrorResponse, createValidationErrorResponse, handleServiceError } from "../../../lib/utils";
import type {
  FlashcardResponse,
  UpdateFlashcardRequest,
  UpdateFlashcardCommand,
  DeleteFlashcardCommand,
  SuccessResponse,
} from "../../../types";

export const prerender = false;

/**
 * PUT /api/flashcards/{id}
 * Update an existing flashcard
 */
export const PUT: APIRoute = async ({ request, params, locals }) => {
  try {
    // Check authentication
    const authResult = await requireAuth(locals);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { userId } = authResult;
    const supabase = locals.supabase;

    // Validate path parameter (flashcard ID)
    let validatedParams: { id: string };
    try {
      validatedParams = UuidPathParamSchema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = formatFlashcardValidationErrors(error);
        return createValidationErrorResponse("Invalid flashcard ID format", validationErrors).response;
      }
      throw error;
    }

    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (_error) {
      return createValidationErrorResponse("Invalid JSON in request body" + _error, []).response;
    }

    // Validate request body
    let validatedRequest: UpdateFlashcardRequest;
    try {
      validatedRequest = UpdateFlashcardRequestSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = formatFlashcardValidationErrors(error);
        return createValidationErrorResponse("Validation failed", validationErrors).response;
      }
      throw error;
    }

    // Convert to command model
    const command: UpdateFlashcardCommand = {
      id: validatedParams.id,
      user_id: userId,
      front_text: validatedRequest.front_text,
      back_text: validatedRequest.back_text,
      source: validatedRequest.source,
      updated_at: new Date().toISOString(),
    };

    // Initialize service and update flashcard
    const flashcardService = new FlashcardService(supabase);

    try {
      const result = await flashcardService.updateFlashcard(validatedParams.id, command, userId);

      // Return successful response
      const successResponse: FlashcardResponse = {
        success: true,
        data: result,
      };

      return new Response(JSON.stringify(successResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      // Handle specific service errors using centralized error handler
      if (serviceError instanceof Error) {
        return handleServiceError(serviceError).response;
      }

      // Re-throw unexpected errors to be handled by the outer catch block
      throw serviceError;
    }
  } catch (error) {
    // Handle unexpected errors using centralized error handler
    if (error instanceof Error) {
      return handleServiceError(error).response;
    }

    // Fallback for non-Error objects
    return createServerErrorResponse("An unexpected error occurred").response;
  }
};

/**
 * DELETE /api/flashcards/{id}
 * Soft delete a flashcard (mark as deleted)
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Check authentication
    const authResult = await requireAuth(locals);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { userId } = authResult;
    const supabase = locals.supabase;

    // Validate path parameter (flashcard ID)
    let validatedParams: { id: string };
    try {
      validatedParams = UuidPathParamSchema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = formatFlashcardValidationErrors(error);
        return createValidationErrorResponse("Invalid flashcard ID format", validationErrors).response;
      }
      throw error;
    }

    // Convert to command model
    const command: DeleteFlashcardCommand = {
      id: validatedParams.id,
      user_id: userId,
    };

    // Initialize service and delete flashcard
    const flashcardService = new FlashcardService(supabase);

    try {
      await flashcardService.deleteFlashcard(command);

      // Return successful response
      const successResponse: SuccessResponse = {
        success: true,
        message: "Flashcard deleted successfully",
      };

      return new Response(JSON.stringify(successResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (serviceError) {
      // Handle specific service errors using centralized error handler
      if (serviceError instanceof Error) {
        return handleServiceError(serviceError).response;
      }

      // Re-throw unexpected errors to be handled by the outer catch block
      throw serviceError;
    }
  } catch (error) {
    // Handle unexpected errors using centralized error handler
    if (error instanceof Error) {
      return handleServiceError(error).response;
    }

    // Fallback for non-Error objects
    return createServerErrorResponse("An unexpected error occurred").response;
  }
};
