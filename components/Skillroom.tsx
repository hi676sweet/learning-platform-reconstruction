"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import Artwork from "./Artwork";
import type { ClassSession, Enrollment, LearningClass, Workspace } from "@/lib/types";

const categories = ["All classes", "Communication", "Data", "Product", "Design", "Career"];
const zones = ["Asia/Singapore", "Asia/Tokyo", "Europe/London", "America/New_York", "UTC"];
const initials = (name: string) => name.split(" ").map(word => word[0]).join("");
function dateLabel(value: string, zone: string) { return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: zone }).format(new Date(value)); }
function timeLabel(value: string, zone: string) { return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short", timeZone: zone }).format(new Date(value)); }
function Arrow() { return <span aria-hidden="true">↗</span>; }
function Clock() { return <svg aria-hidden="true" width="15" height="15" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" /><path d="M10 6v4l3 2" stroke="currentColor" strokeLinecap="round" /></svg>; }

async function jsonRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "This request could not be completed.");
  return data;
}

export default function Skillroom({ view, slug }: { view: "catalog" | "detail" | "learning"; slug?: string }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All classes");
  const [level, setLevel] = useState("All levels");
  const [zone, setZone] = useState("Asia/Singapore");
  const [selectedSession, setSelectedSession] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    jsonRequest("/api/workspace").then((data: Workspace) => { if (active) setWorkspace(data); }).catch((reason: Error) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, []);

  const currentClass = workspace?.classes.find(item => item.slug === slug);
  const classSessions = workspace?.sessions.filter(item => item.classId === currentClass?.id) ?? [];
  const chosenSession = classSessions.find(item => item.id === selectedSession) ?? classSessions[0];
  const activeEnrollments = workspace?.enrollments.filter(item => item.status !== "cancelled") ?? [];
  const currentEnrollment = activeEnrollments.find(item => item.sessionId === chosenSession?.id);
  const visibleClasses = workspace?.classes.filter(item =>
    (category === "All classes" || item.category === category) &&
    (level === "All levels" || item.level === level) &&
    `${item.title} ${item.subtitle} ${item.category} ${item.instructor}`.toLowerCase().includes(search.toLowerCase().trim())) ?? [];

  async function refresh() { setWorkspace(await jsonRequest("/api/workspace")); }
  async function reserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chosenSession || busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true); setError(""); setNotice("");
    try {
      const { enrollment }: { enrollment: Enrollment } = await jsonRequest("/api/enrollments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: chosenSession.id, name: values.get("name"), email: values.get("email") })
      });
      await refresh();
      setNotice(enrollment.status === "confirmed" ? "Your seat is confirmed. Find the details in My learning." : `You're on the waitlist at position ${enrollment.queuePosition}. Check My learning for updates.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Please try again."); await refresh().catch(() => {}); }
    finally { setBusy(false); }
  }
  async function cancel(enrollment: Enrollment) {
    setBusy(true); setError(""); setNotice("");
    try {
      await jsonRequest(`/api/enrollments/${enrollment.id}`, { method: "DELETE", headers: { "Content-Type": "application/json" } });
      await refresh(); setNotice("Enrollment cancelled. Any available seat was offered to the next person on the waitlist.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Please try again."); }
    finally { setBusy(false); }
  }

  return <>
    <div className="demo-strip"><span>Small steps. New possibilities.</span><span>Independent reconstruction · Fictional classes</span></div>
    <header className="site-header"><div className="wrap header-inner">
      <Link className="brand" href="/" aria-label="Skillroom home"><span className="brand-mark" aria-hidden="true"><i /><i /></span>skillroom<span className="brand-dot">.</span></Link>
      <nav aria-label="Main navigation"><Link href="/" className={view === "catalog" ? "active" : ""}>Explore classes</Link><Link href="/#how-it-works">How it works</Link></nav>
      <Link className={`learning-link ${view === "learning" ? "active" : ""}`} href="/my-learning">My learning <span>{activeEnrollments.length}</span></Link>
    </div></header>
    <main>
      {view === "catalog" && <section className="hero wrap">
        <div className="hero-copy"><div className="eyebrow light">A LITTLE CURIOSITY GOES A LONG WAY</div><h1>Make room for<br />what&apos;s <em>next.</em></h1><p>Fresh perspectives. Practical skills.<br />Live classes for the way you want to grow.</p><a className="button peach-button" href="#classes">Find your next class <Arrow /></a><div className="hero-note"><span className="little-spark" aria-hidden="true">✳</span> A small step today. A new possibility tomorrow.</div></div>
        <div className="hero-visual"><span className="hero-orbit orbit-one" /><span className="hero-orbit orbit-two" /><div className="floating-note note-top"><span className="note-icon" aria-hidden="true">✦</span><div>A fresh perspective<br /><strong>is a good place to start.</strong></div></div><div className="hero-book"><div className="book-label">THE EVERYDAY LEARNING SERIES</div><Artwork kind="writing" hero /><div className="book-bottom"><span>Stay curious.</span><span aria-hidden="true">↗</span></div></div><div className="floating-note note-bottom"><span className="live-dot" /> Live learning. Real practice.</div></div>
      </section>}

      {error && <div className="wrap message error" role="alert">{error}<button type="button" aria-label="Dismiss error" onClick={() => setError("")}>×</button></div>}
      {notice && <div className="wrap message success" role="status">{notice}<button type="button" aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}
      {!workspace && <div className="wrap loading-state" role="status">{error ? "Reload the page to try again." : "Making room for your next class…"}</div>}

      {view === "catalog" && workspace && <>
        <div className="wrap promise-row"><div><span aria-hidden="true">↗</span><p><strong>Learn something useful.</strong> Put it into practice.</p></div><div><span aria-hidden="true">✳</span><p><strong>Show up curious.</strong> Leave with a new idea.</p></div><div><span aria-hidden="true">◷</span><p><strong>Make a little time.</strong> Find your own pace.</p></div></div>
        <section id="classes" className="wrap catalog-section">
          <div className="section-heading"><div><span className="eyebrow">GOOD THINGS START WITH CURIOSITY</span><h2>Where will you go next?</h2></div><p>Six original classes. Plenty of possibilities.</p></div>
          <div className="catalog-toolbar"><label className="search-field"><svg aria-hidden="true" width="19" height="19" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" /><path d="m13 13 4 4" stroke="currentColor" /></svg><input type="search" aria-label="Search classes" placeholder="What are you curious about?" value={search} onChange={event => setSearch(event.target.value)} maxLength={100} /></label><label className="level-field"><span>Level</span><select aria-label="Level" value={level} onChange={event => setLevel(event.target.value)}><option>All levels</option><option>Beginner</option><option>Intermediate</option></select></label></div>
          <div className="filter-row"><div className="category-options" aria-label="Class categories">{categories.map(item => <button key={item} type="button" className={category === item ? "category-chip selected" : "category-chip"} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div><span className="result-count" aria-live="polite">{visibleClasses.length} {visibleClasses.length === 1 ? "class" : "classes"}</span></div>
          <div className="timezone-row"><label htmlFor="catalog-zone">Display time zone</label><select id="catalog-zone" value={zone} onChange={event => setZone(event.target.value)}>{zones.map(item => <option key={item}>{item}</option>)}</select></div>
          <div className="class-grid">{visibleClasses.map(item => <ClassCard key={item.id} item={item} sessions={workspace.sessions.filter(session => session.classId === item.id)} zone={zone} now={workspace.serverTime} />)}</div>
          {visibleClasses.length === 0 && <div className="empty-state"><span aria-hidden="true">✳</span><h3>A different kind of curiosity?</h3><p>Try another keyword or explore the full collection.</p><button type="button" className="text-button" onClick={() => { setSearch(""); setCategory("All classes"); setLevel("All levels"); }}>Clear filters <Arrow /></button></div>}
        </section>
        <section className="wrap how-section" id="how-it-works"><div><span className="eyebrow">A SIMPLE WAY TO KEEP GROWING</span><h2>A little time.<br />A fresh point of view.</h2></div><div className="how-steps"><div><span>01</span><h3>Follow your curiosity</h3><p>Find a topic that speaks to you and choose a session that fits.</p></div><div><span>02</span><h3>Make a little room</h3><p>Reserve a demo seat. If the session is full, join the waitlist.</p></div><div><span>03</span><h3>Take something with you</h3><p>Explore practical ideas in this fictional learning experience.</p></div></div></section>
      </>}

      {view === "detail" && currentClass && workspace && <div className="wrap detail-page">
        <Link href="/" className="back-link">← Back to all classes</Link>
        <div className="detail-layout"><article className="detail-content"><div className={`detail-art art-${currentClass.accent}`}><span className="art-topline">THE EVERYDAY LEARNING SERIES</span><Artwork kind={currentClass.art} /><span className="art-bottomline">{currentClass.category}<Arrow /></span></div><div className="detail-tags"><span>{currentClass.category}</span><span>{currentClass.level}</span><span><Clock /> {currentClass.duration} minutes</span></div><h1>{currentClass.title}</h1><p className="detail-subtitle">{currentClass.subtitle}</p><p className="body-copy">{currentClass.description}</p><section className="detail-section"><span className="eyebrow">A FEW THINGS TO TAKE WITH YOU</span><h2>What you&apos;ll explore</h2><ul className="outcomes">{currentClass.outcomes.map(item => <li key={item}><span aria-hidden="true">✓</span>{item}</li>)}</ul></section><section className="detail-section"><span className="eyebrow">THE SHAPE OF THE SESSION</span><h2>A little look inside</h2><ol className="agenda">{currentClass.agenda.map((item, index) => <li key={item.title}><span>0{index + 1}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div></li>)}</ol></section><section className="instructor-box"><div className={`instructor-avatar art-${currentClass.accent}`}>{initials(currentClass.instructor)}</div><div><span className="eyebrow">MEET YOUR FICTIONAL INSTRUCTOR</span><h3>{currentClass.instructor}</h3><span className="instructor-role">{currentClass.instructorRole}</span><p>{currentClass.instructorBio}</p></div></section></article>
          <aside className="booking-panel"><span className="eyebrow">MAKE ROOM FOR SOMETHING NEW</span><h2>Your next little step.</h2><div className="free-label">Free demo enrollment <span>No payment required</span></div><label htmlFor="detail-zone" className="timezone-label">Display time zone</label><select id="detail-zone" className="timezone-select" value={zone} onChange={event => setZone(event.target.value)}>{zones.map(item => <option key={item}>{item}</option>)}</select><fieldset className="session-options"><legend>Choose a session</legend>{classSessions.map(session => <label key={session.id} className={`session-option ${chosenSession?.id === session.id ? "chosen" : ""}`}><input type="radio" name="class-session" checked={chosenSession?.id === session.id} onChange={() => { setSelectedSession(session.id); setError(""); setNotice(""); }} /><span><strong>{dateLabel(session.startsAt, zone)}</strong><span>{timeLabel(session.startsAt, zone)}</span><small>{session.startsAt <= workspace.serverTime ? "Enrollment closed" : session.available > 0 ? `${session.available} of ${session.capacity} seats available` : `Session full · ${session.waitlisted} on waitlist`}</small></span></label>)}</fieldset>
            {currentEnrollment ? <div className="already-enrolled"><span className={`status-badge ${currentEnrollment.status}`}>{currentEnrollment.status === "confirmed" ? "Seat confirmed" : `Waitlist · position ${currentEnrollment.queuePosition}`}</span><p>There&apos;s a little space here with your name on it. Manage your enrollment in My learning.</p><Link className="button primary" href="/my-learning">Go to My learning <Arrow /></Link></div> : chosenSession && chosenSession.startsAt <= workspace.serverTime ? <p className="form-note">This session has started. Choose a later session to join.</p> : <form onSubmit={reserve} className="enrollment-form"><label htmlFor="learner-name">Full name</label><input id="learner-name" name="name" placeholder="Alex Demo" autoComplete="off" required minLength={2} maxLength={80} /><label htmlFor="learner-email">Email address</label><input id="learner-email" name="email" type="email" placeholder="alex@example.test" autoComplete="off" required maxLength={120} /><span className="field-hint">Use fictional details and an email ending in .test.</span><button className="button primary" disabled={busy || !chosenSession} type="submit">{busy ? "Saving your place…" : chosenSession && chosenSession.available === 0 ? "Join the waitlist" : "Reserve your seat"}<Arrow /></button><p className="form-note">This is a simulated enrollment. No email is sent and no live class takes place.</p></form>}
            <div className="waitlist-note"><span aria-hidden="true">↻</span><p>Plans change. Cancel before the session starts and the next person on the waitlist gets the seat.</p></div>
          </aside>
        </div>
      </div>}

      {view === "learning" && workspace && <section className="wrap learning-page"><div className="page-title"><span className="eyebrow">A LITTLE TIME, JUST FOR YOU</span><h1>My learning.</h1><p>Your next steps, all in one place.</p></div><div className="learning-note"><span aria-hidden="true">◷</span><p>Times below use <strong>{zone}</strong>. Your enrollments belong to this browser session.</p><label><span className="sr-only">Display time zone</span><select aria-label="Display time zone" value={zone} onChange={event => setZone(event.target.value)}>{zones.map(item => <option key={item}>{item}</option>)}</select></label></div>{workspace.enrollments.length === 0 ? <div className="empty-state learning-empty"><span aria-hidden="true">✳</span><h2>Good things start with a little curiosity.</h2><p>You haven&apos;t reserved a class yet. Find something you&apos;d like to explore.</p><Link className="button primary" href="/">Explore classes <Arrow /></Link></div> : <div className="enrollment-list">{workspace.enrollments.map(enrollment => { const item = workspace.classes.find(item => item.id === enrollment.classId)!; const session = workspace.sessions.find(item => item.id === enrollment.sessionId)!; return <article className={`enrollment-card ${enrollment.status}`} key={enrollment.id} data-testid="enrollment-card" data-status={enrollment.status}><Link href={`/classes/${item.slug}`} className={`enrollment-art art-${item.accent}`}><Artwork kind={item.art} /></Link><div className="enrollment-info"><div className="enrollment-kicker"><span>{item.category}</span><span className={`status-badge ${enrollment.status}`}>{enrollment.status === "confirmed" ? "Seat confirmed" : enrollment.status === "waitlisted" ? `Waitlist · position ${enrollment.queuePosition}` : "Cancelled"}</span></div><h2><Link href={`/classes/${item.slug}`}>{item.title}</Link></h2><p>{dateLabel(session.startsAt, zone)} · {timeLabel(session.startsAt, zone)} · {item.duration} min</p><span className="learner-name">For {enrollment.name}</span>{enrollment.status === "waitlisted" && <p className="waitlist-explanation">Your place moves forward when a seat becomes available. Reload this page to check for updates.</p>}<div className="enrollment-actions"><Link href={`/classes/${item.slug}`}>Class details <Arrow /></Link>{enrollment.status !== "cancelled" && session.startsAt > workspace.serverTime && <button type="button" disabled={busy} onClick={() => cancel(enrollment)} aria-label={`Cancel enrollment for ${item.title}`}>Cancel enrollment</button>}</div></div></article>; })}</div>}<div className="learning-footer"><Link href="/">← Find a little more inspiration</Link><button type="button" className="text-button" onClick={() => { refresh().catch((reason: Error) => setError(reason.message)); }}>Refresh enrollments <span aria-hidden="true">↻</span></button></div></section>}
    </main>
    <footer className="site-footer"><div className="wrap footer-top"><div><Link className="brand footer-brand" href="/">skillroom<span className="brand-dot">.</span></Link><p>Make room for a little more.</p></div><div><span className="eyebrow light">YOUR NEXT CHAPTER STARTS SMALL</span><h2>Stay curious.<br />See what happens.</h2></div><nav aria-label="Footer navigation"><Link href="/">Explore classes <Arrow /></Link><Link href="/my-learning">My learning <Arrow /></Link><a href="https://github.com/hi676sweet/learning-platform-reconstruction">About this reconstruction <Arrow /></a></nav></div><div className="wrap footer-bottom"><span>Original portfolio reconstruction · Created November 2026</span><span>Fictional classes & people · No payments or live events</span></div></footer>
  </>;
}

function ClassCard({ item, sessions, zone, now }: { item: LearningClass; sessions: ClassSession[]; zone: string; now: string }) {
  const nextSession = sessions.find(session => session.startsAt > now) ?? sessions[0];
  return <article className="class-card"><Link href={`/classes/${item.slug}`} className={`class-art art-${item.accent}`} aria-label={`View ${item.title}`}><span className="live-badge"><span className="live-dot" /> LIVE CLASS</span><Artwork kind={item.art} /><span className="art-arrow" aria-hidden="true">↗</span></Link><div className="card-meta"><span>{item.category}</span><span>{item.level}</span></div><h3><Link href={`/classes/${item.slug}`}>{item.title}</Link></h3><p className="class-subtitle">{item.subtitle}</p><div className="card-instructor"><span className={`mini-avatar art-${item.accent}`}>{initials(item.instructor)}</span><span>{item.instructor}</span><span className="duration"><Clock />{item.duration} min</span></div><div className="card-bottom"><span>{nextSession ? `${dateLabel(nextSession.startsAt, zone)} · ${timeLabel(nextSession.startsAt, zone)}` : "More sessions soon"}</span><Link href={`/classes/${item.slug}`} aria-label={`View class details for ${item.title}`}>View class <Arrow /></Link></div></article>;
}
