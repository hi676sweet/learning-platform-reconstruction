import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/store";
import { fail, requireJsonOrigin, requireOwner } from "@/lib/http";
export const runtime = "nodejs";
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    requireJsonOrigin(request);
    const { id } = await context.params;
    return NextResponse.json({ enrollment: getStore().cancel(requireOwner(request), id) });
  } catch (error) { return fail(error); }
}
