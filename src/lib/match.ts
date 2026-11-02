// Grading what was said against the sentence, word by word — as the words come in.
export type Mark = "pending" | "correct" | "wrong";
export interface Graded {
  text: string;
  mark: Mark;
  heard?: string; // what was heard in its place, "" when it was skipped
}

const key = (w: string) => w.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]/g, "");
const split = (s: string) => s.split(/\s+/).filter((w) => key(w));

// Aligns what was heard with the sentence (edit distance over words). While still listening, only the start of the
// sentence that was reached is graded — the rest stays pending; once final, a word never heard is wrong.
export function grade(sentence: string, transcript: string, final: boolean): Graded[] {
  const words = split(sentence);
  const target = words.map(key);
  const heard = split(transcript);
  const said = heard.map(key);
  const n = target.length;
  const m = said.length;
  const d = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      d[i]![j] = Math.min(d[i - 1]![j - 1]! + (target[i - 1] === said[j - 1] ? 0 : 1), d[i - 1]![j]! + 1, d[i]![j - 1]! + 1);

  let end = n;
  if (!final) {
    end = 0;
    for (let i = 0; i <= n; i++) if (d[i]![m]! <= d[end]![m]!) end = i;
    if (m === 0) end = 0;
  }

  const out: Graded[] = words.map((text) => ({ text, mark: "pending" }));
  let i = end;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i]![j] === d[i - 1]![j - 1]! + (target[i - 1] === said[j - 1] ? 0 : 1)) {
      const ok = target[i - 1] === said[j - 1];
      out[i - 1] = { text: words[i - 1]!, mark: ok ? "correct" : "wrong", heard: ok ? undefined : heard[j - 1] };
      i--;
      j--;
    } else if (i > 0 && d[i]![j] === d[i - 1]![j]! + 1) {
      out[i - 1] = { text: words[i - 1]!, mark: "wrong", heard: "" };
      i--;
    } else j--;
  }
  return out;
}

export const scoreOf = (graded: Graded[]) => Math.round((graded.filter((g) => g.mark === "correct").length / Math.max(1, graded.length)) * 100);
export const cleanWord = (w: string) => w.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "");
