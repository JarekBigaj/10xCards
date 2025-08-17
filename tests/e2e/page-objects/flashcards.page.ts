import { type Page, type Locator, expect } from "@playwright/test";

export class FlashcardsPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly flashcardTable: Locator;
  readonly searchInput: Locator;
  readonly filterSelect: Locator;
  readonly sortButton: Locator;
  readonly bulkActionsPanel: Locator;
  readonly deleteSelectedButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByTestId("create-flashcard-button");
    this.flashcardTable = page.getByTestId("flashcards-table");
    this.searchInput = page.getByTestId("flashcards-search-input");
    this.filterSelect = page.getByTestId("flashcards-filter-select");
    this.sortButton = page.getByTestId("flashcards-sort-button");
    this.bulkActionsPanel = page.getByTestId("bulk-actions-panel");
    this.deleteSelectedButton = page.getByTestId("delete-selected-button");
  }

  async goto() {
    await this.page.goto("/flashcards");
  }

  async createFlashcard(front: string, back: string, tags: string[] = []) {
    await this.createButton.click();

    const modal = this.page.getByTestId("create-flashcard-modal");
    await modal.getByTestId("flashcard-front-input").fill(front);
    await modal.getByTestId("flashcard-back-input").fill(back);

    if (tags.length > 0) {
      const tagsInput = modal.getByTestId("flashcard-tags-input");
      await tagsInput.fill(tags.join(", "));
    }

    await modal.getByTestId("save-flashcard-button").click();
    await expect(modal).not.toBeVisible();
  }

  async searchFlashcards(query: string) {
    await this.searchInput.fill(query);
    await this.page.keyboard.press("Enter");
  }

  async filterByDifficulty(difficulty: string) {
    await this.filterSelect.click();
    await this.page.getByRole("option", { name: difficulty }).click();
  }

  async selectFlashcard(index: number) {
    const checkbox = this.flashcardTable
      .locator("tr")
      .nth(index + 1) // +1 because first row is header
      .getByTestId("flashcard-checkbox");
    await checkbox.click();
  }

  async deleteSelectedFlashcards() {
    await expect(this.bulkActionsPanel).toBeVisible();
    await this.deleteSelectedButton.click();

    const confirmationModal = this.page.getByTestId("delete-confirmation-modal");
    await confirmationModal.getByTestId("confirm-delete-button").click();
  }

  async expectFlashcardVisible(front: string) {
    await expect(this.flashcardTable.getByText(front)).toBeVisible();
  }

  async expectFlashcardCount(count: number) {
    const rows = this.flashcardTable.locator("tbody tr");
    await expect(rows).toHaveCount(count);
  }

  async expectBulkActionsPanelVisible() {
    await expect(this.bulkActionsPanel).toBeVisible();
  }
}
