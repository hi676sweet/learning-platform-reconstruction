import { NextResponse, type NextRequest } from "next/server";
import { DomainError, getStore } from "./store.ts";
import { validateMutationHeaders } from "./origin.ts";
export const COOKIE_NAME = "skillroom_session";
export function requireJsonOrigin(request: NextRequest) {
  validateMutationHeaders(request.headers, request.url, process.env.SKILLROOM_ORIGIN);
}
export function requireOwner(request: NextRequest) {
  const owner = getStore().ownerForToken(request.cookies.get(COOKIE_NAME)?.value);
  if (!owner) throw new DomainError("Reload the page to begin a demo session.", 401);
  return owner;
}
export function fail(error: unknown) {
  if (error instanceof DomainError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  console.error("Skillroom request failed", error instanceof Error ? error.message : "Unknown error");
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
