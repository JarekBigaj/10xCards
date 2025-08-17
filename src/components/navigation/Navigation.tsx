import React from "react";
import { AuthButton } from "./AuthButton";
import { NavigationBadge } from "./NavigationBadge";
import { useFlashcardCounts } from "../../lib/hooks/useFlashcardCounts";

interface User {
  id: string;
  email: string;
  email_confirmed: boolean;
}

interface NavigationProps {
  user: User | null;
  currentPath: string;
}

export function Navigation({ user, currentPath }: NavigationProps) {
  const isAuthPage = currentPath.startsWith("/auth/");
  const { total: flashcardsCount, dueToday } = useFlashcardCounts();

  return (
    <nav className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo i główna nawigacja - lewa strona */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <a href="/" className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <span className="ml-2 text-xl font-bold text-foreground">10xCards</span>
            </a>

            {/* Główne linki nawigacji - tylko jeśli nie jesteśmy na stronach auth */}
            {!isAuthPage && (
              <div className="hidden md:flex items-center space-x-6">
                {user ? (
                  // Nawigacja dla zalogowanych użytkowników
                  <>
                    <a
                      href="/dashboard"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        currentPath === "/dashboard" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      Dashboard
                    </a>
                    <a
                      href="/generate"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        currentPath === "/generate" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      Generuj fiszki
                    </a>
                    <a
                      href="/flashcards"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        currentPath === "/flashcards" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      Moje fiszki
                      {user && <NavigationBadge count={flashcardsCount} />}
                    </a>
                    <a
                      href="/study"
                      className={`text-sm font-medium transition-colors hover:text-primary ${
                        currentPath === "/study" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      Sesja nauki
                      {user && <NavigationBadge count={dueToday} variant="urgent" />}
                    </a>
                  </>
                ) : (
                  // Nawigacja dla niezalogowanych użytkowników
                  <a
                    href="/generate"
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      currentPath === "/generate" ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    Generuj fiszki
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Nawigacja użytkownika - prawa strona */}
          <div className="flex items-center space-x-4">
            {/* Powiadomienie o niepotwierdzonym emailu */}
            {user && !user.email_confirmed && !isAuthPage && (
              <div className="hidden sm:flex items-center text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Potwierdź email
              </div>
            )}

            <AuthButton user={user} />
          </div>
        </div>
      </div>

      {/* Mobile navigation menu - placeholder dla przyszłej implementacji */}
      {!isAuthPage && (
        <div className="md:hidden border-t border-border">
          <div className="px-4 py-3 space-y-2">
            {user ? (
              <>
                <a
                  href="/dashboard"
                  className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentPath === "/dashboard"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Dashboard
                </a>
                <a
                  href="/generate"
                  className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentPath === "/generate"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Generuj fiszki
                </a>
                <a
                  href="/flashcards"
                  className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentPath === "/flashcards"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center">
                    Moje fiszki
                    <NavigationBadge count={flashcardsCount} />
                  </span>
                </a>
                <a
                  href="/study"
                  className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentPath === "/study"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center">
                    Sesja nauki
                    <NavigationBadge count={dueToday} variant="urgent" />
                  </span>
                </a>
              </>
            ) : (
              <a
                href="/generate"
                className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPath === "/generate"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Generuj fiszki
              </a>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
