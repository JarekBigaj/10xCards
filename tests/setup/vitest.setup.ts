import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { TEST_ENV } from "./env";
import { server } from "../mocks/server";

// Setup MSW
beforeAll(() => {
  // Setup MSW server
  server.listen();

  // Mock environment variables
  vi.stubGlobal("process", {
    env: TEST_ENV,
  });

  // Mock window.location
  Object.defineProperty(window, "location", {
    value: {
      href: "http://localhost:3000",
      origin: "http://localhost:3000",
      pathname: "/",
      search: "",
      hash: "",
    },
    writable: true,
  });

  // Mock fetch for API calls - simplified for now
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    })
  ) as any;
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  server.resetHandlers();
});

// Cleanup after all tests
afterAll(() => {
  vi.restoreAllMocks();
  server.close();
});

// Custom matchers
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received instanceof Element && document.body.contains(received);
    return {
      message: () => `expected element ${pass ? "not " : ""}to be in the document`,
      pass,
    };
  },
});
