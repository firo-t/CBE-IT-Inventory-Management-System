"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";
import type { User } from "@/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getSession());
  }, []);

  return {
    user,
    isAuthenticated: !!user,
  };
}
