import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { DomainError, Store } from "../lib/store.ts";

const date = new Date("2026-11-09T12:00:00Z");
const payload = { sessionId: "session-writing-1", name: "Alex Demo", email: "alex@example.test" };
const fixture = () => new Store(":memory:", () => date);
const isError = (status: number) => (error: unknown) => error instanceof DomainError && error.status === status;

test("the initial catalog has six original classes and future ISO sessions", () => {
  const store = fixture();
  try {
    assert.equal(store.classes().length, 6);
    assert.equal(store.sessions().length, 7);
    for (const session of store.sessions()) {
      assert.ok(Date.parse(session.startsAt) > date.getTime());
      assert.ok(Date.parse(session.endsAt) > Date.parse(session.startsAt));
      assert.equal(session.confirmed, 0); assert.equal(session.available, session.capacity);
    }
  } finally { store.close(); }
});

test("the final seat is allocated once and further learners join a FIFO waitlist", () => {
  const store = fixture();
  try {
    const people = Array.from({ length: 4 }, () => store.createSession().owner);
    const entries = people.map(owner => store.enroll(owner, payload));
    assert.deepEqual(entries.map(item => item.status), ["confirmed", "confirmed", "waitlisted", "waitlisted"]);
    assert.deepEqual(entries.slice(2).map(item => item.queuePosition), [1, 2]);
    const session = store.sessions().find(item => item.id === payload.sessionId)!;
    assert.deepEqual([session.confirmed, session.available, session.waitlisted], [2, 0, 2]);
    store.cancel(people[0], entries[0].id);
    assert.equal(store.enrollments(people[2])[0].status, "confirmed");
    assert.equal(store.enrollments(people[3])[0].queuePosition, 1);
    assert.equal(store.sessions().find(item => item.id === payload.sessionId)!.confirmed, 2);
  } finally { store.close(); }
});

test("duplicate enrollment rejects without consuming capacity or adding a waitlist entry", () => {
  const store = fixture();
  try {
    const owner = store.createSession().owner;
    store.enroll(owner, payload);
    assert.throws(() => store.enroll(owner, payload), isError(409));
    assert.equal(store.enrollments(owner).length, 1);
    assert.equal(store.sessions().find(item => item.id === payload.sessionId)!.confirmed, 1);
  } finally { store.close(); }
});

test("cancellation is idempotent and a cancelled learner rejoins at the back", () => {
  const store = fixture();
  try {
    const owners = Array.from({ length: 5 }, () => store.createSession().owner);
    const entries = owners.map(owner => store.enroll(owner, payload));
    store.cancel(owners[2], entries[2].id);
    assert.equal(store.enrollments(owners[3])[0].queuePosition, 1);
    const rejoined = store.enroll(owners[2], payload);
    assert.equal(rejoined.queuePosition, 3);
    store.cancel(owners[0], entries[0].id);
    store.cancel(owners[0], entries[0].id);
    assert.equal(store.enrollments(owners[3])[0].status, "confirmed");
    assert.equal(store.enrollments(owners[4])[0].status, "waitlisted");
    assert.equal(store.enrollments(owners[2]).find(item => item.id === rejoined.id)!.queuePosition, 2);
  } finally { store.close(); }
});

test("a shopper cannot list or cancel another session's enrollment", () => {
  const store = fixture();
  try {
    const a = store.createSession(); const b = store.createSession();
    const entry = store.enroll(a.owner, payload);
    assert.deepEqual(store.enrollments(b.owner), []);
    assert.throws(() => store.cancel(b.owner, entry.id), isError(404));
    assert.equal(store.enrollments(a.owner)[0].status, "confirmed");
    assert.equal(store.ownerForToken(a.token), a.owner);
    assert.equal(store.ownerForToken("a".repeat(64)), null);
    assert.equal(store.ownerForToken("malformed"), null);
    assert.ok(!JSON.stringify(store.workspace(a.owner)).includes(a.owner));
    assert.ok(!JSON.stringify(store.workspace(a.owner)).includes(a.token));
  } finally { store.close(); }
});

test("invalid inputs and unknown sessions make no writes", () => {
  const store = fixture();
  try {
    const owner = store.createSession().owner;
    for (const input of [null, [], { ...payload, name: "A" }, { ...payload, email: "alex@gmail.com" }, { ...payload, email: "bad" }]) assert.throws(() => store.enroll(owner, input), isError(400));
    assert.throws(() => store.enroll(owner, { ...payload, sessionId: "missing" }), isError(404));
    assert.equal(store.enrollments(owner).length, 0);
    assert.equal(store.sessions().find(item => item.id === payload.sessionId)!.available, 2);
  } finally { store.close(); }
});

test("started sessions reject both new enrollment and cancellation", () => {
  let current = date;
  const store = new Store(":memory:", () => current);
  try {
    const a = store.createSession().owner; const b = store.createSession().owner;
    const entry = store.enroll(a, payload);
    current = new Date(store.sessions().find(item => item.id === payload.sessionId)!.startsAt);
    assert.throws(() => store.enroll(b, payload), isError(409));
    assert.throws(() => store.cancel(a, entry.id), isError(409));
    assert.equal(store.enrollments(a)[0].status, "confirmed");
  } finally { store.close(); }
});

test("two independent database connections share capacity and preserve data after reopening", () => {
  const directory = mkdtempSync(join(tmpdir(), "skillroom-test-"));
  const path = join(directory, "test.sqlite");
  let a: Store | undefined; let b: Store | undefined;
  try {
    a = new Store(path, () => date); b = new Store(path, () => date);
    const first = a.createSession(); const second = b.createSession(); const third = b.createSession();
    a.enroll(first.owner, payload); b.enroll(second.owner, payload);
    assert.equal(b.enroll(third.owner, payload).status, "waitlisted");
    a.close(); a = undefined; b.close(); b = undefined;
    a = new Store(path, () => date);
    assert.equal(a.ownerForToken(first.token), first.owner);
    assert.equal(a.enrollments(first.owner)[0].status, "confirmed");
    assert.equal(a.sessions().find(item => item.id === payload.sessionId)!.confirmed, 2);
    assert.equal(a.sessions().find(item => item.id === payload.sessionId)!.waitlisted, 1);
  } finally {
    a?.close(); b?.close();
    if (dirname(directory) !== resolve(tmpdir()) || !basename(directory).startsWith("skillroom-test-")) throw new Error("Unexpected test cleanup directory");
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a transaction failure leaves no enrollment or capacity change", () => {
  const store = fixture();
  try {
    const owner = store.createSession().owner;
    store.db.exec("CREATE TRIGGER reject_enrollment BEFORE INSERT ON enrollments BEGIN SELECT RAISE(ABORT,'simulated failure'); END;");
    assert.throws(() => store.enroll(owner, payload), /simulated failure/);
    assert.equal(store.enrollments(owner).length, 0);
    assert.equal(store.sessions().find(item => item.id === payload.sessionId)!.available, 2);
    store.db.exec("DROP TRIGGER reject_enrollment");
    assert.equal(store.enroll(owner, payload).status, "confirmed");
  } finally { store.close(); }
});

test("expired owner sessions cannot retrieve or mutate enrollments", () => {
  let current = date;
  const store = new Store(":memory:", () => current);
  try {
    const session = store.createSession();
    current = new Date(date.getTime() + 15 * 86400000);
    assert.equal(store.ownerForToken(session.token), null);
    assert.throws(() => store.enrollments(session.owner), isError(401));
    assert.throws(() => store.enroll(session.owner, payload), isError(401));
  } finally { store.close(); }
});

test("a failed waitlist promotion rolls back the cancellation as well", () => {
  const store = fixture();
  try {
    const owners = Array.from({ length: 3 }, () => store.createSession().owner);
    const entries = owners.map(owner => store.enroll(owner, payload));
    store.db.exec("CREATE TRIGGER reject_promotion BEFORE UPDATE OF status ON enrollments WHEN OLD.status='waitlisted' AND NEW.status='confirmed' BEGIN SELECT RAISE(ABORT,'promotion failed'); END;");
    assert.throws(() => store.cancel(owners[0], entries[0].id), /promotion failed/);
    assert.equal(store.enrollments(owners[0])[0].status, "confirmed");
    assert.equal(store.enrollments(owners[2])[0].status, "waitlisted");
    assert.equal(store.sessions().find(item => item.id === payload.sessionId)!.confirmed, 2);
    store.db.exec("DROP TRIGGER reject_promotion");
    store.cancel(owners[0], entries[0].id);
    assert.equal(store.enrollments(owners[2])[0].status, "confirmed");
  } finally { store.close(); }
});
