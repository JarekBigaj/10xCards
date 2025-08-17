import React from "react";
import { Button } from "../ui/button";
import { UserMenu } from "./UserMenu";

interface User {
  id: string;
  email?: string;
}

interface AuthButtonProps {
  user: User | null;
}

export function AuthButton({ user }: AuthButtonProps) {
  if (user) {
    return <UserMenu user={user} />;
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="ghost" size="sm" asChild>
        <a href="/auth/login">Zaloguj się</a>
      </Button>
      <Button size="sm" asChild>
        <a href="/auth/register">Zarejestruj się</a>
      </Button>
    </div>
  );
}
