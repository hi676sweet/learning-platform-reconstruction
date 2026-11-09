import type { LearningClass } from "@/lib/types";

export default function Artwork({ kind, hero = false }: { kind: LearningClass["art"]; hero?: boolean }) {
  return <svg className={hero ? "course-art hero-art" : "course-art"} viewBox="0 0 400 260" role="img" aria-label={`Illustration for ${kind} skills`}>
    {kind === "writing" && <>
      <rect x="87" y="45" width="227" height="178" rx="5" fill="#fcf8ee" transform="rotate(-7 200 130)" />
      <rect x="104" y="34" width="211" height="178" rx="5" fill="#fffdf5" transform="rotate(5 200 130)" />
      <path d="M144 88h125M144 108h99M144 128h116M144 148h72" stroke="#e0ba9d" strokeWidth="5" strokeLinecap="round" />
      <path d="m239 155 64-61 15 16-64 61-24 9z" fill="#37574d" /><path d="m230 180 9-25 15 16z" fill="#d49c70" /><path d="m236 173-6 7 8-2" fill="#243c3c" />
      <circle cx="85" cy="180" r="29" fill="#ef8959" /><path d="M74 180h22m-11-11v22" stroke="#fff5e5" strokeWidth="3" />
      <path d="m311 55 9-16 4 18 17 5-17 5-6 17-4-18-17-5z" fill="#fff4d8" />
    </>}
    {kind === "data" && <>
      <circle cx="269" cy="100" r="64" fill="#ded3fa" /><path d="M269 36a64 64 0 0 1 64 64h-64z" fill="#536774" /><path d="M269 100h64a64 64 0 0 1-64 64z" fill="#efaa84" />
      <rect x="72" y="148" width="37" height="61" rx="3" fill="#748c7c" /><rect x="123" y="110" width="37" height="99" rx="3" fill="#536774" /><rect x="174" y="71" width="37" height="138" rx="3" fill="#fbf7ed" />
      <path d="m90 107 51-42 53-20" fill="none" stroke="#faf4e4" strokeWidth="3" strokeLinecap="round" /><circle cx="90" cy="107" r="6" fill="#faf4e4" /><circle cx="141" cy="65" r="6" fill="#faf4e4" /><circle cx="194" cy="45" r="6" fill="#faf4e4" />
    </>}
    {kind === "roadmap" && <>
      <path d="M84 182h73V93h83v66h74" fill="none" stroke="#486352" strokeWidth="5" strokeDasharray="6 7" strokeLinecap="round" />
      <rect x="58" y="144" width="76" height="72" rx="6" fill="#faf7e9" /><rect x="120" y="47" width="76" height="72" rx="6" fill="#7e9d80" /><rect x="215" y="116" width="76" height="72" rx="6" fill="#eab58b" />
      <path d="m77 179 11 11 25-27M138 78h37m-37 13h24m58 57h43m-43 13h30" stroke="#35584d" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="317" cy="159" r="20" fill="#365b4b" /><path d="m310 152 8 7-8 7" stroke="#f7f4df" strokeWidth="3" fill="none" />
    </>}
    {kind === "speaking" && <>
      <circle cx="209" cy="130" r="90" fill="#f5e5aa" /><path d="M156 96h-43v68h43l60 43V53z" fill="#526c65" /><rect x="91" y="114" width="31" height="32" rx="4" fill="#fcf7df" />
      <path d="M246 94q35 36 0 72m25-96q58 60 0 120m26-145q80 85 0 170" fill="none" stroke="#b4965b" strokeWidth="4" strokeLinecap="round" />
      <path d="m128 174 17 37h29l-20-47" fill="#526c65" />
    </>}
    {kind === "portfolio" && <>
      <rect x="77" y="71" width="225" height="142" rx="7" fill="#6d90a0" transform="rotate(-12 190 140)" /><rect x="95" y="54" width="225" height="142" rx="7" fill="#fff9ec" transform="rotate(4 207 125)" />
      <rect x="116" y="79" width="79" height="90" rx="3" fill="#e4b08a" /><circle cx="154" cy="115" r="21" fill="#f7e2be" /><path d="M120 165q35-45 70 0" fill="#63857d" /><path d="M216 92h77m-77 17h60m-60 32h77m-77 16h42" stroke="#78939a" strokeWidth="4" strokeLinecap="round" />
      <circle cx="306" cy="198" r="24" fill="#dc8d66" /><path d="m296 198 7 7 12-15" stroke="#fff9ec" strokeWidth="3" fill="none" />
    </>}
    {kind === "career" && <>
      <path d="M75 211h73v-44h68v-47h68V73h55" fill="none" stroke="#fff9ee" strokeWidth="36" strokeLinejoin="round" />
      <path d="m86 163 67-52 59-11 67-67m-31 3 32-4-3 32" fill="none" stroke="#774e5e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="153" cy="111" r="10" fill="#9b6c75" /><circle cx="212" cy="100" r="10" fill="#9b6c75" /><circle cx="84" cy="163" r="10" fill="#9b6c75" />
    </>}
  </svg>;
}
