import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { learningClasses, seedSessions } from "./seed.ts";
import type { ClassSession, Enrollment, EnrollmentStatus, LearningClass, Workspace } from "./types.ts";

export class DomainError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
export const SESSION_DAYS = 14;
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export class Store {
  db: DatabaseSync;
  now: () => Date;
  constructor(path: string, now: () => Date = () => new Date()) {
    this.now = now;
    if (path !== ":memory:") mkdirSync(dirname(resolve(path)), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS classes (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS class_sessions (
        id TEXT PRIMARY KEY, class_id TEXT NOT NULL REFERENCES classes(id),
        starts_at TEXT NOT NULL, ends_at TEXT NOT NULL, capacity INTEGER NOT NULL CHECK(capacity>0));
      CREATE TABLE IF NOT EXISTS owners (id TEXT PRIMARY KEY, expires_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS enrollments (
        queue_no INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
        session_id TEXT NOT NULL REFERENCES class_sessions(id), owner_id TEXT NOT NULL REFERENCES owners(id),
        name TEXT NOT NULL, email TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('confirmed','waitlisted','cancelled')),
        created_at TEXT NOT NULL, cancelled_at TEXT);
      CREATE UNIQUE INDEX IF NOT EXISTS one_active_enrollment ON enrollments(session_id,owner_id) WHERE status!='cancelled';
      CREATE INDEX IF NOT EXISTS enrollment_queue ON enrollments(session_id,status,queue_no);`);
    const insertClass = this.db.prepare("INSERT OR IGNORE INTO classes(id,data) VALUES(?,?)");
    const insertSession = this.db.prepare("INSERT OR IGNORE INTO class_sessions VALUES(?,?,?,?,?)");
    this.transaction(() => {
      for (const item of learningClasses) insertClass.run(item.id, JSON.stringify(item));
      for (const session of seedSessions(this.now())) insertSession.run(session.id, session.classId, session.startsAt, session.endsAt, session.capacity);
    });
  }
  close() { this.db.close(); }
  private transaction<T>(work: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try { const value = work(); this.db.exec("COMMIT"); return value; }
    catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }
  createSession(): { token: string; owner: string } {
    const token = randomBytes(32).toString("hex");
    const owner = digest(token);
    const expires = new Date(this.now().getTime() + SESSION_DAYS * 86400000).toISOString();
    this.db.prepare("INSERT INTO owners VALUES(?,?)").run(owner, expires);
    return { token, owner };
  }
  ownerForToken(token: string | undefined): string | null {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const owner = digest(token);
    return this.db.prepare("SELECT id FROM owners WHERE id=? AND expires_at>?").get(owner, this.now().toISOString()) ? owner : null;
  }
  private requireOwner(owner: string) {
    if (!this.db.prepare("SELECT id FROM owners WHERE id=? AND expires_at>?").get(owner, this.now().toISOString())) throw new DomainError("Your demo session expired. Reload the page to start a new one.", 401);
  }
  classes(): LearningClass[] {
    return this.db.prepare("SELECT data FROM classes ORDER BY rowid").all().map(row => JSON.parse(String(row.data)) as LearningClass);
  }
  sessions(): ClassSession[] {
    return this.db.prepare(`SELECT s.id,s.class_id,s.starts_at,s.ends_at,s.capacity,
      SUM(CASE WHEN e.status='confirmed' THEN 1 ELSE 0 END) AS confirmed,
      SUM(CASE WHEN e.status='waitlisted' THEN 1 ELSE 0 END) AS waitlisted
      FROM class_sessions s LEFT JOIN enrollments e ON e.session_id=s.id GROUP BY s.id ORDER BY s.starts_at,s.id`).all().map(row => ({
      id: String(row.id), classId: String(row.class_id), startsAt: String(row.starts_at), endsAt: String(row.ends_at),
      capacity: Number(row.capacity), confirmed: Number(row.confirmed), waitlisted: Number(row.waitlisted), available: Number(row.capacity) - Number(row.confirmed)
    }));
  }
  enrollments(owner: string): Enrollment[] {
    this.requireOwner(owner);
    return this.db.prepare(`SELECT e.*,s.class_id,
      CASE WHEN e.status='waitlisted' THEN (SELECT COUNT(*) FROM enrollments q WHERE q.session_id=e.session_id AND q.status='waitlisted' AND q.queue_no<=e.queue_no) ELSE NULL END AS position
      FROM enrollments e JOIN class_sessions s ON s.id=e.session_id WHERE e.owner_id=? ORDER BY e.queue_no DESC`).all(owner).map(row => ({
      id: String(row.id), sessionId: String(row.session_id), classId: String(row.class_id), name: String(row.name),
      status: String(row.status) as EnrollmentStatus, createdAt: String(row.created_at), queuePosition: row.position === null ? null : Number(row.position)
    }));
  }
  workspace(owner: string): Workspace { return { serverTime: this.now().toISOString(), classes: this.classes(), sessions: this.sessions(), enrollments: this.enrollments(owner) }; }
  enroll(owner: string, payload: unknown): Enrollment {
    this.requireOwner(owner);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new DomainError("Provide your class and fictional learner details.");
    const data = payload as Record<string, unknown>;
    const sessionId = typeof data.sessionId === "string" ? data.sessionId : "";
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
    if (name.length < 2 || name.length > 80) throw new DomainError("Enter a fictional name between 2 and 80 characters.");
    if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.test$/.test(email)) throw new DomainError("Use a fictional email ending in .test, such as alex@example.test.");
    const id = randomUUID();
    this.transaction(() => {
      const session = this.db.prepare("SELECT * FROM class_sessions WHERE id=?").get(sessionId);
      if (!session) throw new DomainError("This class session could not be found.", 404);
      if (String(session.starts_at) <= this.now().toISOString()) throw new DomainError("Enrollment for this session has closed.", 409);
      if (this.db.prepare("SELECT id FROM enrollments WHERE owner_id=? AND session_id=? AND status!='cancelled'").get(owner, sessionId)) throw new DomainError("You already have an active enrollment for this session.", 409);
      const confirmed = Number(this.db.prepare("SELECT COUNT(*) AS count FROM enrollments WHERE session_id=? AND status='confirmed'").get(sessionId)!.count);
      const status: EnrollmentStatus = confirmed < Number(session.capacity) ? "confirmed" : "waitlisted";
      this.db.prepare("INSERT INTO enrollments(id,session_id,owner_id,name,email,status,created_at) VALUES(?,?,?,?,?,?,?)").run(id, sessionId, owner, name, email, status, this.now().toISOString());
    });
    return this.enrollments(owner).find(item => item.id === id)!;
  }
  cancel(owner: string, id: string): Enrollment {
    this.requireOwner(owner);
    this.transaction(() => {
      const current = this.db.prepare("SELECT e.*,s.starts_at FROM enrollments e JOIN class_sessions s ON s.id=e.session_id WHERE e.id=? AND e.owner_id=?").get(id, owner);
      if (!current) throw new DomainError("This enrollment could not be found.", 404);
      if (current.status === "cancelled") return;
      if (String(current.starts_at) <= this.now().toISOString()) throw new DomainError("This session has started; enrollment changes are closed.", 409);
      this.db.prepare("UPDATE enrollments SET status='cancelled',cancelled_at=? WHERE id=?").run(this.now().toISOString(), id);
      if (current.status === "confirmed") {
        const next = this.db.prepare("SELECT id FROM enrollments WHERE session_id=? AND status='waitlisted' ORDER BY queue_no LIMIT 1").get(String(current.session_id));
        if (next) this.db.prepare("UPDATE enrollments SET status='confirmed' WHERE id=? AND status='waitlisted'").run(String(next.id));
      }
    });
    return this.enrollments(owner).find(item => item.id === id)!;
  }
}

const globalStore = globalThis as unknown as { skillroomStore?: Store };
export function getStore() {
  if (!globalStore.skillroomStore) globalStore.skillroomStore = new Store(process.env.SKILLROOM_DB_PATH || ".data/skillroom.sqlite");
  return globalStore.skillroomStore;
}
