"use client";
import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";
const initialState: LoginState = {};
export function LoginForm() { const [state, action, pending] = useActionState(login, initialState); return <form action={action} className="space-y-5"><label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label><label className="block text-sm font-medium">Password<input name="password" type="password" autoComplete="current-password" minLength={10} required className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label>{state.error ? <p role="alert" className="text-sm text-red-600">{state.error}</p> : null}<button disabled={pending} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button></form>; }

