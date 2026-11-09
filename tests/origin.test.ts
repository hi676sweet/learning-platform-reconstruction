import test from "node:test";
import assert from "node:assert/strict";
import { validateMutationHeaders } from "../lib/origin.ts";
import { DomainError } from "../lib/store.ts";

const headers = (values: Record<string, string> = {}) => new Headers({ "content-type": "application/json", host: "127.0.0.1:3102", origin: "http://127.0.0.1:3102", ...values });
const rejects = (status: number) => (error: unknown) => error instanceof DomainError && error.status === status;

test("real 127.0.0.1 browser requests are accepted even when Next uses internal localhost", () => {
  assert.doesNotThrow(() => validateMutationHeaders(headers(), "http://localhost:3102/api/enrollments"));
});

test("a different origin or port is rejected", () => {
  for (const origin of ["https://attacker.example", "http://127.0.0.1:3103", "null", "http://127.0.0.1:3102/forged-path"]) {
    assert.throws(() => validateMutationHeaders(headers({ origin }), "http://localhost:3102/api/enrollments"), rejects(403));
  }
});

test("cross-site fetches and form content types remain rejected", () => {
  assert.throws(() => validateMutationHeaders(headers({ "sec-fetch-site": "cross-site" }), "http://localhost:3102/api/enrollments"), rejects(403));
  assert.throws(() => validateMutationHeaders(headers({ "content-type": "text/plain" }), "http://localhost:3102/api/enrollments"), rejects(415));
  assert.doesNotThrow(() => validateMutationHeaders(headers({ "content-type": "Application/JSON; charset=utf-8" }), "http://localhost:3102/api/enrollments"));
});

test("a configured HTTPS public origin works through a proxy without trusting forwarded headers", () => {
  const proxied = headers({ host: "internal:3102", origin: "https://learning.example.test", "x-forwarded-host": "attacker.example" });
  assert.doesNotThrow(() => validateMutationHeaders(proxied, "http://internal:3102/api/enrollments", "https://learning.example.test"));
  assert.throws(() => validateMutationHeaders(proxied, "http://internal:3102/api/enrollments"), rejects(403));
});

test("malformed hosts cannot replace the expected origin", () => {
  for (const host of ["good.example/path", "user@good.example", "bad host", "good.example?override=1"]) {
    assert.throws(() => validateMutationHeaders(headers({ host }), "http://localhost:3102/api/enrollments"), rejects(403));
  }
});
