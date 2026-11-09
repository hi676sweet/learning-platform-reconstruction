import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { fail, requireJsonOrigin, requireOwner } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    requireJsonOrigin(request);
    return NextResponse.json({ enrollment: getStore().enroll(requireOwner(request), await request.json()) }, { status: 201 });
  } catch (error) { return fail(error); }
}
