import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock crypto for node environment
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "mock-uuid-1234-5678",
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

describe("Auth Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a UUID", () => {
    const uuid = crypto.randomUUID();
    expect(uuid).toBe("mock-uuid-1234-5678");
  });

  it("should generate random values", () => {
    const arr = new Uint8Array(10);
    const result = crypto.getRandomValues(arr);
    expect(result).toHaveLength(10);
    expect(result).toBeInstanceOf(Uint8Array);
  });
});
