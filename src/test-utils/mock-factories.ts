import { Flashcard, User } from "@/types";

export const createMockFlashcard = (overrides: Partial<Flashcard> = {}): Flashcard => ({
  id: "mock-flashcard-id",
  front: "Mock front text",
  back: "Mock back text",
  tags: ["mock", "test"],
  difficulty: "intermediate" as const,
  user_id: "mock-user-id",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  front_hash: "mock-front-hash",
  back_hash: "mock-back-hash",
  ...overrides,
});

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: "mock-user-id",
  email: "test@example.com",
  user_metadata: {},
  app_metadata: {},
  ...overrides,
});

export const createMockFlashcards = (count = 3): Flashcard[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockFlashcard({
      id: `mock-flashcard-${index + 1}`,
      front: `Mock front ${index + 1}`,
      back: `Mock back ${index + 1}`,
      tags: [`tag-${index + 1}`],
    })
  );
};
