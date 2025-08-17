import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { LoginSchema } from "../../../lib/validation/auth-schemas.ts";
import { handleAuthError, handleValidationError, handleServerError } from "../../../lib/utils/auth-errors.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();

    // Walidacja danych wejściowych
    const validatedData = LoginSchema.parse(body);

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return handleAuthError(error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: {
            id: data.user.id,
            email: data.user.email,
            email_confirmed: data.user.email_confirmed_at ? true : false,
          },
          session: {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
          },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return handleValidationError(error as any);
    }
    return handleServerError(error);
  }
};
