import { NextResponse, type NextRequest } from "next/server";
import { getStore, SESSION_DAYS } from "@/lib/store";
import { COOKIE_NAME, fail } from "@/lib/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const store = getStore();
    let owner = store.ownerForToken(request.cookies.get(COOKIE_NAME)?.value);
    let token: string | undefined;
    if (!owner) { const created = store.createSession(); owner = created.owner; token = created.token; }
    const response = NextResponse.json(store.workspace(owner), { headers: { "Cache-Control": "no-store" } });
    if (token) response.cookies.set(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", secure: new URL(process.env.SKILLROOM_ORIGIN || request.url).protocol === "https:", path: "/", maxAge: SESSION_DAYS * 86400 });
    return response;
  } catch (error) { return fail(error); }
}
