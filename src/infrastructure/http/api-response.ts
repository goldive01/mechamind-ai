import { NextResponse } from "next/server";

export function apiSuccess<T>(body: T, status = 200): NextResponse<T> { return NextResponse.json(body, { status }); }
export function apiError(message: string, status: number, extra: Record<string, unknown> = {}) { return NextResponse.json({ error: message, ...extra }, { status }); }
export const validationIssues = (issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>) => issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));

