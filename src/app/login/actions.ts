"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SESSION_COOKIE } from "@/lib/auth-session";
import { AuthenticationError } from "@/services/AuthenticationService";
import { createAuthServices } from "@/services/authFactory";
export interface LoginState { error?: string }
export async function login(_state: LoginState, formData: FormData): Promise<LoginState> { try { const result = await createAuthServices().authentication.login({ email: formData.get("email"), password: formData.get("password") }); (await cookies()).set(SESSION_COOKIE, result.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: result.expiresAt }); } catch (error) { if (error instanceof z.ZodError) return { error: "Enter a valid email and password (minimum 10 characters)." }; if (error instanceof AuthenticationError) return { error: error.message }; return { error: "Unable to sign in." }; } redirect("/dashboard"); }
export async function logout() { const store = await cookies(); await createAuthServices().authentication.logout(store.get(SESSION_COOKIE)?.value); store.delete(SESSION_COOKIE); redirect("/login"); }

