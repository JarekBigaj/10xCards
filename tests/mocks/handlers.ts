import { http, HttpResponse } from "msw";

const API_BASE_URL = "http://localhost:54321";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export const handlers = [
  // Supabase Auth handlers
  http.post(`${API_BASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_in: 3600,
      token_type: "bearer",
      user: {
        id: "mock-user-id",
        email: "test@example.com",
        user_metadata: {},
        app_metadata: {},
      },
    });
  }),

  // Supabase Flashcards API handlers
  http.get(`${API_BASE_URL}/rest/v1/flashcards`, () => {
    return HttpResponse.json([
      {
        id: "1",
        front: "What is React?",
        back: "A JavaScript library for building user interfaces",
        tags: ["javascript", "react"],
        difficulty: "intermediate",
        user_id: "mock-user-id",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "2",
        front: "What is TypeScript?",
        back: "A typed superset of JavaScript",
        tags: ["typescript", "javascript"],
        difficulty: "beginner",
        user_id: "mock-user-id",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ]);
  }),

  http.post(`${API_BASE_URL}/rest/v1/flashcards`, async ({ request }) => {
    const flashcard = await request.json();
    return HttpResponse.json(
      {
        id: "new-flashcard-id",
        ...flashcard,
        user_id: "mock-user-id",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  http.patch(`${API_BASE_URL}/rest/v1/flashcards`, async ({ request }) => {
    const flashcard = await request.json();
    return HttpResponse.json({
      ...flashcard,
      updated_at: new Date().toISOString(),
    });
  }),

  http.delete(`${API_BASE_URL}/rest/v1/flashcards`, () => {
    return HttpResponse.json({}, { status: 204 });
  }),

  // OpenRouter API handlers
  http.post(`${OPENROUTER_BASE_URL}/chat/completions`, async ({ request }) => {
    const body = await request.json();

    // Simulate different responses based on the request
    if (body?.messages?.[0]?.content?.includes("error")) {
      return HttpResponse.json({ error: { message: "Simulated API error" } }, { status: 500 });
    }

    return HttpResponse.json({
      id: "mock-completion-id",
      object: "chat.completion",
      created: Date.now(),
      model: "mock-model",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify([
              {
                front: "Mock generated front",
                back: "Mock generated back",
                tags: ["mock", "generated"],
                difficulty: "intermediate",
              },
            ]),
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      },
    });
  }),

  // Health check handlers
  http.get(`${OPENROUTER_BASE_URL}/models`, () => {
    return HttpResponse.json({
      data: [
        {
          id: "mock-model",
          object: "model",
          created: Date.now(),
          owned_by: "mock-provider",
        },
      ],
    });
  }),
];
