# Testing Setup for 10xCards

## Overview

This project uses a comprehensive testing setup with:
- **Vitest** + **React Testing Library** for unit and integration tests
- **Playwright** for end-to-end tests
- **MSW (Mock Service Worker)** for API mocking

## Project Structure

```
tests/
├── unit/                     # Unit tests
│   └── components/          # React component tests
├── e2e/                     # End-to-end tests
│   ├── page-objects/        # Page Object Model classes
│   └── *.spec.ts           # E2E test specs
├── mocks/                   # MSW handlers and setup
│   ├── handlers.ts          # API mock handlers
│   ├── server.ts            # Node.js MSW server
│   └── browser.ts           # Browser MSW worker
├── setup/                   # Test setup files
│   └── vitest.setup.ts      # Vitest global setup
└── README.md               # This file

src/test-utils/             # Test utilities
├── testing-library-utils.tsx  # Custom render function
└── mock-factories.ts          # Mock data factories
```

## Available Scripts

### Unit Tests (Vitest)
```bash
npm run test                 # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:ui             # Open Vitest UI
npm run test:coverage       # Run tests with coverage
npm run test:unit           # Run only unit tests
```

### E2E Tests (Playwright)
```bash
npm run test:e2e            # Run E2E tests
npm run test:e2e:ui         # Run E2E tests with UI
npm run test:e2e:debug      # Debug E2E tests
```

### All Tests
```bash
npm run test:all            # Run both unit and E2E tests
```

## Writing Unit Tests

### Basic Component Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@/test-utils/testing-library-utils';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const mockFn = vi.fn();
    render(<MyComponent onClick={mockFn} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
```

### Mocking Services

```typescript
import { vi } from 'vitest';

// Mock a service
vi.mock('@/lib/services/flashcard.service', () => ({
  createFlashcard: vi.fn(),
  getFlashcards: vi.fn(),
}));

// Use in test
const mockCreateFlashcard = vi.mocked(createFlashcard);
mockCreateFlashcard.mockResolvedValue(mockFlashcard);
```

### Using MSW for API Testing

MSW is automatically configured in the test setup. Handlers are defined in `tests/mocks/handlers.ts`.

## Writing E2E Tests

### Basic Page Test

```typescript
import { test, expect } from '@playwright/test';
import { FlashcardsPage } from './page-objects/flashcards.page';

test.describe('Flashcards', () => {
  let flashcardsPage: FlashcardsPage;

  test.beforeEach(async ({ page }) => {
    flashcardsPage = new FlashcardsPage(page);
    await flashcardsPage.goto();
  });

  test('should create a new flashcard', async () => {
    await flashcardsPage.createFlashcard('Front', 'Back', ['tag1']);
    await flashcardsPage.expectFlashcardVisible('Front');
  });
});
```

### Page Object Pattern

Create page objects in `tests/e2e/page-objects/` following this pattern:

```typescript
import { Page, Locator, expect } from '@playwright/test';

export class MyPage {
  readonly page: Page;
  readonly someElement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.someElement = page.getByTestId('some-element');
  }

  async goto() {
    await this.page.goto('/my-page');
  }

  async performAction() {
    await this.someElement.click();
  }

  async expectSomeState() {
    await expect(this.someElement).toBeVisible();
  }
}
```

## Testing Guidelines

### Unit Tests (Vitest)
- Follow **Arrange, Act, Assert** pattern
- Use `vi.fn()` for function mocks
- Use `vi.spyOn()` to monitor existing functions
- Use `vi.mock()` for module mocks
- Test user interactions, not implementation details
- Use custom render function with providers

### E2E Tests (Playwright)
- Use Page Object Model for maintainable tests
- Use `data-testid` attributes for reliable element selection
- Test critical user journeys
- Use visual comparisons with `expect(page).toHaveScreenshot()`
- Leverage parallel execution for faster runs

### MSW (API Mocking)
- Define all API handlers in `tests/mocks/handlers.ts`
- Use conditional responses to test different scenarios
- Mock both success and error responses
- Keep handlers close to real API behavior

## Configuration

### Vitest Configuration
- Environment: jsdom for DOM testing
- Global setup in `tests/setup/vitest.setup.ts`
- Coverage thresholds: 80% for all metrics
- TypeScript support out-of-the-box

### Playwright Configuration
- Browser: Chromium only (Desktop Chrome)
- Base URL: http://localhost:4321
- Automatic server startup
- Screenshots and videos on failure
- Trace collection on retry

## Debugging

### Unit Tests
```bash
npm run test:ui              # Use Vitest UI for debugging
npm run test:watch           # Watch mode for iterative development
```

### E2E Tests
```bash
npm run test:e2e:debug       # Debug mode with browser visible
npm run test:e2e:ui          # Playwright UI for test exploration
```

### IDE Integration
- VS Code Vitest extension for inline test running
- Playwright VS Code extension for E2E test debugging

## CI/CD Integration

Tests are configured for CI environments:
- Vitest runs in non-watch mode
- Playwright runs in headless mode with retries
- Coverage reports are generated
- Test artifacts (videos, traces) are preserved on failure

## Performance

- Unit tests use jsdom for fast DOM simulation
- E2E tests run in parallel by default
- MSW provides deterministic API responses
- Coverage collection is optimized for development speed
