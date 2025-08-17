import { type Flashcard } from "@/types";
import type { User } from "@supabase/supabase-js";

export const createMockFlashcard = (overrides: Partial<Flashcard> = {}): Flashcard => ({
  id: "mock-flashcard-id",
  front_text: "Mock front text",
  back_text: "Mock back text",
  difficulty: 2,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  due: "2024-01-01T00:00:00Z",
  reps: 0,
  scheduled_days: 0,
  source: "manual",
  ...overrides,
});

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "mock-user-id",
  email: "test@example.com",
  user_metadata: {},
  app_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

export const createMockFlashcards = (count = 3): Flashcard[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockFlashcard({
      id: `mock-flashcard-${index + 1}`,
      front_text: `Mock front ${index + 1}`,
      back_text: `Mock back ${index + 1}`,
    })
  );
};
