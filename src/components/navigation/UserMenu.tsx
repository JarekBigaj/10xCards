import React, { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";

interface User {
  id: string;
  email: string;
  email_confirmed: boolean;
}

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Zamknij menu po kliknięciu poza nim
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Obsługa wylogowania
  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Przekieruj do strony głównej po pomyślnym wylogowaniu
        window.location.href = "/";
      } else {
        console.error("Logout failed");
        // Fallback - przekieruj mimo błędu
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback - przekieruj mimo błędu
      window.location.href = "/";
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Przycisk użytkownika */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 rounded-md p-2 text-sm hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {/* Avatar placeholder */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
          {user.email.charAt(0).toUpperCase()}
        </div>

        {/* Email - ukryty na mobile */}
        <span className="hidden sm:block font-medium text-foreground truncate max-w-32">{user.email}</span>

        {/* Chevron down icon */}
        <svg
          className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-border bg-popover shadow-lg">
          <div className="p-1">
            {/* User info section */}
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium text-popover-foreground truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {user.email_confirmed ? (
                  <span className="flex items-center">
                    <svg className="mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Email potwierdzony
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="mr-1 h-3 w-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Email niepotwierdzony
                  </span>
                )}
              </p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <a
                href="/dashboard"
                className="flex items-center px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7zm0 0a2 2 0 012-2h6l2 2h6a2 2 0 012 2v.01M7 13h10M7 17h10"
                  />
                </svg>
                Dashboard
              </a>

              <a
                href="/profile"
                className="flex items-center px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profil
              </a>

              {!user.email_confirmed && (
                <button
                  className="flex w-full items-center px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
                  onClick={() => {
                    // TODO: Implementacja ponownego wysłania emaila
                    console.log("Resending confirmation email...");
                    setIsOpen(false);
                  }}
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Wyślij ponownie email
                </button>
              )}

              <div className="my-1 border-t border-border" />

              <button
                onClick={handleLogout}
                className="flex w-full items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive rounded-sm transition-colors"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Wyloguj się
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
