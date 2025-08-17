import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { ForgotPasswordSchema } from "../../../lib/validation/auth-schemas.ts";
import { handleAuthError, handleValidationError, handleServerError } from "../../../lib/utils/auth-errors.ts";
import { z } from "zod";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const validatedData = ForgotPasswordSchema.parse(body);

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
    });

    if (error) {
      return handleAuthError(error);
    }

    // Zawsze zwracamy sukces (security przez obscurity)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Jeśli konto istnieje, otrzymasz email z linkiem do resetu hasła",
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
