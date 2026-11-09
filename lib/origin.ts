import { DomainError } from "./store.ts";

/** Next can expose its internal localhost URL while the browser uses 127.0.0.1. */
export function validateMutationHeaders(headers: Headers, requestUrl: string, canonicalOrigin?: string) {
  if (headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new DomainError("Send requests as application/json.", 415);
  const origin = headers.get("origin");
  const internalUrl = new URL(requestUrl);
  let expectedOrigin = internalUrl.origin;
  const host = headers.get("host");
  if (host) {
    let publicUrl: URL;
    try { publicUrl = new URL(`${internalUrl.protocol}//${host}`); }
    catch { throw new DomainError("Invalid request host.", 403); }
    if (publicUrl.username || publicUrl.password || publicUrl.pathname !== "/" || publicUrl.search || publicUrl.hash) throw new DomainError("Invalid request host.", 403);
    expectedOrigin = publicUrl.origin;
  }
  if (canonicalOrigin) expectedOrigin = new URL(canonicalOrigin).origin;
  if ((origin && origin !== expectedOrigin) || headers.get("sec-fetch-site") === "cross-site") throw new DomainError("Cross-site requests are not accepted.", 403);
}
