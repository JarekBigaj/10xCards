import React from "react";
import { Button } from "./ui/button";

interface User {
  id: string;
  email: string;
  email_confirmed: boolean;
}

interface HomePageProps {
  user: User | null;
}

export function HomePage({ user }: HomePageProps) {
  // Dla zalogowanych użytkowników - przekierowanie do dashboard
  if (user) {
    // eslint-disable-next-line react-compiler/react-compiler
    window.location.href = "/dashboard";
    return null;
  }

  // Dla niezalogowanych użytkowników - strona powitalna
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center space-y-8">
            {/* Logo i tytuł */}
            <div className="space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <svg
                  className="h-10 w-10"
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

              <h1 className="text-4xl sm:text-6xl font-bold text-foreground">
                <span className="bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
                  10xCards
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Rewolucyjna platforma do nauki z wykorzystaniem sztucznej inteligencji.
                <br className="hidden sm:block" />
                Generuj fiszki automatycznie i ucz się 10x szybciej!
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-8 py-3">
                <a href="/auth/register">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Zacznij za darmo
                </a>
              </Button>

              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
                <a href="/generate">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m6-10V7a3 3 0 11-6 0V4a2 2 0 00-2-2H9a2 2 0 00-2 2v3a3 3 0 106 0z"
                    />
                  </svg>
                  Wypróbuj demo
                </a>
              </Button>
            </div>

            {/* Social proof */}
            <p className="text-sm text-muted-foreground">✨ Bez rejestracji • 🚀 Instant start • 🎯 Oparte na AI</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Dlaczego 10xCards?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Wykorzystujemy najnowsze technologie AI, aby uczynić naukę bardziej efektywną niż kiedykolwiek wcześniej
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center space-y-4 p-6 rounded-xl bg-card border border-border hover:shadow-md transition-shadow">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">Automatyczne generowanie</h3>
              <p className="text-muted-foreground">
                Wklej tekst, a AI automatycznie utworzy dla Ciebie fiszki z najważniejszymi informacjami
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center space-y-4 p-6 rounded-xl bg-card border border-border hover:shadow-md transition-shadow">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">Inteligentne powtórki</h3>
              <p className="text-muted-foreground">
                System adaptuje się do Twojego tempa nauki i przypomina o powtórkach w optymalnych momentach
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center space-y-4 p-6 rounded-xl bg-card border border-border hover:shadow-md transition-shadow">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">Nowoczesny interfejs</h3>
              <p className="text-muted-foreground">
                Intuicyjny design i ciemny motyw sprawiają, że nauka jest przyjemna o każdej porze dnia
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Jak to działa?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Rozpocznij naukę w trzech prostych krokach
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold text-foreground">Wklej tekst</h3>
                <p className="text-muted-foreground">
                  Skopiuj materiał do nauki - może to być wykład, artykuł lub notatki
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute top-6 -right-4 text-muted-foreground">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold text-foreground">AI generuje fiszki</h3>
                <p className="text-muted-foreground">
                  Nasza sztuczna inteligencja analizuje tekst i tworzy najlepsze pytania i odpowiedzi
                </p>
              </div>
              {/* Arrow */}
              <div className="hidden md:block absolute top-6 -right-4 text-muted-foreground">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-foreground">Ucz się efektywnie</h3>
              <p className="text-muted-foreground">
                Rozpocznij sesję nauki i obserwuj jak Twoja wiedza rośnie z każdym dniem
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 to-primary/10 border-t border-border">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Gotowy na rewolucję w nauce?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Dołącz do tysięcy studentów, którzy już odkryli potęgę AI w nauce. Rozpocznij już dziś i zobacz różnicę!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-8 py-3">
                <a href="/auth/register">Rozpocznij za darmo</a>
              </Button>

              <p className="text-sm text-muted-foreground">Darmowe konto • Bez zobowiązań • Instant start</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-foreground">10xCards</span>
            </div>

            <div className="flex space-x-6 text-sm text-muted-foreground">
              <button className="hover:text-foreground transition-colors">Polityka prywatności</button>
              <button className="hover:text-foreground transition-colors">Regulamin</button>
              <button className="hover:text-foreground transition-colors">Kontakt</button>
            </div>

            <p className="text-sm text-muted-foreground">© 2024 10xCards. Wszystkie prawa zastrzeżone.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
