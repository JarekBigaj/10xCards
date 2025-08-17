import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "@/test-utils/testing-library-utils";
import { GenerateButton } from "@/components/GenerateButton";

describe("GenerateButton", () => {
  const mockProps = {
    onClick: vi.fn(),
    isLoading: false,
    disabled: false,
    text: "Test input text",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the generate button", () => {
    render(<GenerateButton {...mockProps} />);

    expect(screen.getByRole("button", { name: /generuj fiszki/i })).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    render(<GenerateButton {...mockProps} />);

    const button = screen.getByRole("button", { name: /generuj fiszki/i });
    fireEvent.click(button);

    expect(mockProps.onClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<GenerateButton {...mockProps} disabled={true} />);

    const button = screen.getByRole("button", { name: /generuj fiszki/i });
    expect(button).toBeDisabled();
  });

  it("shows loading state when isLoading is true", () => {
    render(<GenerateButton {...mockProps} isLoading={true} />);

    expect(screen.getByText(/generowanie/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call onClick when text is empty", () => {
    render(<GenerateButton {...mockProps} text="" />);

    const button = screen.getByRole("button", { name: /generuj fiszki/i });
    fireEvent.click(button);

    expect(mockProps.onClick).not.toHaveBeenCalled();
  });

  it("does not call onClick when disabled", () => {
    render(<GenerateButton {...mockProps} disabled={true} />);

    const button = screen.getByRole("button", { name: /generuj fiszki/i });
    fireEvent.click(button);

    expect(mockProps.onClick).not.toHaveBeenCalled();
  });
});
