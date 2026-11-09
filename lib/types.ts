export type ClassCategory = "Communication" | "Data" | "Product" | "Design" | "Career";
export type Level = "All levels" | "Beginner" | "Intermediate";
export type EnrollmentStatus = "confirmed" | "waitlisted" | "cancelled";

export interface LearningClass {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: ClassCategory;
  level: Level;
  duration: number;
  instructor: string;
  instructorRole: string;
  instructorBio: string;
  accent: string;
  art: "writing" | "data" | "roadmap" | "speaking" | "portfolio" | "career";
  outcomes: string[];
  agenda: { title: string; detail: string }[];
}
export interface ClassSession {
  id: string;
  classId: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  confirmed: number;
  waitlisted: number;
  available: number;
}
export interface Enrollment {
  id: string;
  sessionId: string;
  classId: string;
  name: string;
  status: EnrollmentStatus;
  createdAt: string;
  queuePosition: number | null;
}
export interface Workspace {
  serverTime: string;
  classes: LearningClass[];
  sessions: ClassSession[];
  enrollments: Enrollment[];
}
