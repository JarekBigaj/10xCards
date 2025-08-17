import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import { handleServerError } from "../../../lib/utils/auth-errors.ts";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    const { error } = await supabase.auth.signOut();

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Wylogowano pomyślnie",
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
