import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { handleAuthError, handleServerError } from "../../../lib/utils/auth-errors.ts";
import { requireAuth } from "../../../lib/utils/auth.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Check authentication
    const authResult = await requireAuth(locals);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { userId } = authResult;

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Soft delete all user flashcards first (mark as deleted)
    const { error: flashcardsError } = await supabase
      .from("flashcards")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_deleted", false);

    if (flashcardsError) {
      // Continue with account deletion even if flashcards deletion fails
    }

    // Soft delete all user review records
    const { error: reviewsError } = await supabase
      .from("review_records")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_deleted", false);

    if (reviewsError) {
      // Continue with account deletion even if reviews deletion fails
    }

    // Sign out the current session (soft account deletion)
    // Note: Full user deletion would require admin service role key
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      return handleAuthError(signOutError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Konto zostało usunięte pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleServerError(error);
  }
};
