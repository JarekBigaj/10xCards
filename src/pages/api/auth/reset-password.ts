import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { ResetPasswordSchema } from "../../../lib/validation/auth-schemas.ts";
import { handleAuthError, handleValidationError, handleServerError } from "../../../lib/utils/auth-errors.ts";
import { z } from "zod";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const validatedData = ResetPasswordSchema.parse(body);

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Weryfikacja tokenu reset hasła
    const {
      data: { user },
      error: verifyError,
    } = await supabase.auth.verifyOtp({
      token_hash: validatedData.token,
      type: "recovery",
    });

    if (verifyError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nieprawidłowy lub wygasły token resetowania hasła",
          code: "INVALID_TOKEN",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Aktualizacja hasła
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.password,
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
