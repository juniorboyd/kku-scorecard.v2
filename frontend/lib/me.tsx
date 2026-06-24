"use client";
import { createContext, useContext } from "react";

export type Role = "ADMIN" | "ANALYST" | "VIEWER";

export type Me = {
  id?: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: Role | string;
  facultyName?: string;
} | null;

/**
 * Current authenticated user, provided by AppShell after it calls /auth/me.
 * Null on public pages or before the first fetch resolves.
 */
export const MeContext = createContext<Me>(null);

export function useMe(): Me {
  return useContext(MeContext);
}

export function useRole(): string | null {
  return useContext(MeContext)?.role ?? null;
}

/**
 * VIEWER is read-only (view / filter / export). ADMIN and ANALYST may
 * create / update / delete. Mutation controls are gated on this.
 */
export function useCanEdit(): boolean {
  const role = useRole();
  return role === "ADMIN" || role === "ANALYST";
}
