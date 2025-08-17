import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { ChangePasswordSchema } from "../../../lib/validation/auth-schemas.ts";
import { handleAuthError, handleValidationError, handleServerError } from "../../../lib/utils/auth-errors.ts";
import { requireAuth } from "../../../lib/utils/auth.ts";
import { z } from "zod";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Check authentication
    const authResult = await requireAuth(locals);
    if ("error" in authResult) {
      return authResult.error;
    }

    const { user } = authResult;

    const body = await request.json();

    // Walidacja danych wejściowych
    const validatedData = ChangePasswordSchema.parse(body);

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Pierwsza weryfikacja - sprawdź obecne hasło poprzez próbę logowania
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email || "",
      password: validatedData.currentPassword,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nieprawidłowe obecne hasło",
          code: "INVALID_CURRENT_PASSWORD",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Aktualizacja hasła
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword,
    });

    if (updateError) {
      return handleAuthError(updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Hasło zostało zmienione pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleValidationError(error);
    }
    return handleServerError(error);
  }
};
