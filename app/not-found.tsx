import Link from "next/link";
export default function NotFound() {
  return <main className="standalone-empty"><span className="eyebrow">A SMALL DETOUR</span><h1>This class isn&apos;t on the board.</h1><p>Head back to the collection to find your next little step.</p><Link className="button primary" href="/">Explore classes <span aria-hidden="true">↗</span></Link></main>;
}
