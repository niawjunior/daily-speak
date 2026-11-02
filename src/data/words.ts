// The words on screen for the journal's data (src/lib/journal.ts), and its shapes.
export type { Progress, Today, WordCard } from "@/lib/journal";

export const categories = {
  home: "ในบ้าน",
  work: "ที่ทำงาน",
  food: "ร้านอาหาร",
  travel: "เดินทาง",
  shopping: "ช้อปปิ้ง",
  social: "เข้าสังคม",
} as const;

export const levels = { A1: "เริ่มต้น", A2: "พื้นฐาน", B1: "กลาง" } as const;

// A day as "2026-11-02" — a Date taken as well.
export const isoDay = (v: string | Date) => (typeof v === "string" ? v : v.toISOString()).slice(0, 10);
// Noon in Bangkok on that day, so the day never shifts with the phone's time zone.
export const dayDate = (v: string | Date) => new Date(`${isoDay(v)}T12:00:00+07:00`);
export const thaiDate = (v: string | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  dayDate(v).toLocaleDateString("th-TH", opts);

// A score's word and colour.
export function scoreLook(score: number | null): { label: string; tone: "success" | "accent" | "destructive" | "muted" } {
  if (score === null) return { label: "ยังไม่ฝึก", tone: "muted" };
  if (score >= 90) return { label: "แม่นมาก", tone: "success" };
  if (score >= 70) return { label: "ใกล้แล้ว", tone: "accent" };
  return { label: "ควรฝึกซ้ำ", tone: "destructive" };
}

export const toneClass = {
  success: "bg-success/12 text-success border-success/25",
  accent: "bg-accent/25 text-accent-foreground border-accent/40",
  destructive: "bg-destructive/10 text-destructive border-destructive/25",
  muted: "bg-background text-muted-foreground border-border",
} as const;
