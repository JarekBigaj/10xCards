import React, { useRef, useEffect } from "react";

interface TextAreaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
}

export function TextAreaInput({
  value,
  onChange,
  placeholder,
  minLength,
  maxLength,
  disabled = false,
}: TextAreaInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize functionality
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) {
      return; // Prevent exceeding max length
    }
    onChange(newValue);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      minLength={minLength}
      maxLength={maxLength}
      disabled={disabled}
      aria-label="Tekst do analizy"
      aria-describedby={minLength ? "char-counter" : undefined}
      className={`
        w-full min-h-[120px] p-4 border rounded-lg resize-none
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        transition-colors duration-200
        ${
          disabled
            ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        }
        ${
          value.length < (minLength || 0)
            ? "border-red-300 dark:border-red-600"
            : value.length > (maxLength || Infinity)
              ? "border-red-300 dark:border-red-600"
              : "border-gray-300 dark:border-gray-600"
        }
      `}
    />
  );
}
