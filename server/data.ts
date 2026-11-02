// Sample data for the demo — kept in memory: a restart starts again from here.
// Everyday English words, one a day, each with short sentences to say aloud.

export type Category = "home" | "work" | "food" | "travel" | "shopping" | "social";

export interface Sentence {
  en: string;
  th: string;
  // What the simulated listener mishears the first time (word in the sentence → what it "heard").
  slip: [string, string];
}

export interface Word {
  id: number;
  word: string;
  ipa: string;
  pos: string;
  meaning: string;
  category: Category;
  level: "A1" | "A2" | "B1";
  tip: string;
  sentences: Sentence[];
}

export interface Attempt {
  id: number;
  wordId: number;
  sentence: number;
  score: number;
  missed: string[];
  at: string;
}

export const words: Word[] = [
  {
    id: 1, word: "appointment", ipa: "/əˈpɔɪnt.mənt/", pos: "คำนาม", meaning: "การนัดหมาย", category: "work", level: "A2",
    tip: "เน้นเสียงพยางค์ที่สอง “POINT” ส่วน t ท้ายคำแทบไม่ออกเสียง",
    sentences: [
      { en: "I have a doctor's appointment today.", th: "วันนี้ฉันมีนัดหมอ", slip: ["appointment", "a point"] },
      { en: "Can we move our appointment to Friday?", th: "เราเลื่อนนัดไปวันศุกร์ได้ไหม", slip: ["Friday", "fried"] },
      { en: "Please be on time for your appointment.", th: "กรุณามาตรงเวลานัด", slip: ["time", "tie"] },
    ],
  },
  {
    id: 2, word: "grocery", ipa: "/ˈɡroʊ.sər.i/", pos: "คำนาม", meaning: "ของชำ ของใช้ในบ้าน", category: "shopping", level: "A2",
    tip: "ออกเสียง “GROW-sər-ee” เน้นพยางค์แรก",
    sentences: [
      { en: "I need to buy some groceries.", th: "ฉันต้องไปซื้อของเข้าบ้าน", slip: ["groceries", "crosses"] },
      { en: "The grocery store closes at ten.", th: "ร้านขายของชำปิดตอนสี่ทุ่ม", slip: ["closes", "clothes"] },
      { en: "She carried the grocery bags home.", th: "เธอถือถุงของชำกลับบ้าน", slip: ["carried", "carry"] },
    ],
  },
  {
    id: 3, word: "commute", ipa: "/kəˈmjuːt/", pos: "คำนาม / คำกริยา", meaning: "การเดินทางไปทำงาน", category: "travel", level: "B1",
    tip: "เน้นพยางค์หลัง “ka-MYOOT” เสียง yoo ยาว",
    sentences: [
      { en: "My commute takes about an hour.", th: "ฉันใช้เวลาเดินทางไปทำงานราวหนึ่งชั่วโมง", slip: ["commute", "computer"] },
      { en: "I commute to work by train.", th: "ฉันนั่งรถไฟไปทำงาน", slip: ["train", "rain"] },
      { en: "The morning commute is always busy.", th: "ช่วงเช้าการเดินทางวุ่นวายเสมอ", slip: ["always", "all ways"] },
    ],
  },
  {
    id: 4, word: "leftovers", ipa: "/ˈleftˌoʊ.vərz/", pos: "คำนาม", meaning: "อาหารที่เหลือ", category: "food", level: "A2",
    tip: "เน้น “LEFT” ชัดๆ แล้วต่อ “oh-vers” ปิดท้ายด้วยเสียง z",
    sentences: [
      { en: "We had leftovers for lunch.", th: "มื้อกลางวันเรากินอาหารที่เหลือ", slip: ["leftovers", "left over"] },
      { en: "Put the leftovers in the fridge.", th: "เอาอาหารที่เหลือใส่ตู้เย็น", slip: ["fridge", "bridge"] },
      { en: "Can I take the leftovers home?", th: "ขอห่ออาหารที่เหลือกลับบ้านได้ไหม", slip: ["take", "tape"] },
    ],
  },
  {
    id: 5, word: "recommend", ipa: "/ˌrek.əˈmend/", pos: "คำกริยา", meaning: "แนะนำ", category: "food", level: "A2",
    tip: "เน้นพยางค์สุดท้าย “rek-uh-MEND”",
    sentences: [
      { en: "What do you recommend here?", th: "ที่นี่มีอะไรแนะนำบ้าง", slip: ["recommend", "record"] },
      { en: "I recommend the green curry.", th: "ฉันแนะนำแกงเขียวหวาน", slip: ["curry", "carry"] },
      { en: "Can you recommend a good hotel?", th: "ช่วยแนะนำโรงแรมดีๆ ได้ไหม", slip: ["hotel", "hot tell"] },
    ],
  },
  {
    id: 6, word: "deadline", ipa: "/ˈded.laɪn/", pos: "คำนาม", meaning: "กำหนดส่ง", category: "work", level: "A2",
    tip: "เสียง d ท้าย “dead” ต่อกับ “line” ทันที ไม่ต้องเว้น",
    sentences: [
      { en: "The deadline is next Monday.", th: "กำหนดส่งคือวันจันทร์หน้า", slip: ["deadline", "headline"] },
      { en: "We finished before the deadline.", th: "เราทำเสร็จก่อนกำหนดส่ง", slip: ["finished", "finish"] },
      { en: "Can we extend the deadline?", th: "เราขยายกำหนดส่งได้ไหม", slip: ["extend", "extent"] },
    ],
  },
  {
    id: 7, word: "receipt", ipa: "/rɪˈsiːt/", pos: "คำนาม", meaning: "ใบเสร็จ", category: "shopping", level: "A2",
    tip: "ตัว p ไม่ออกเสียง พูดว่า “ri-SEET”",
    sentences: [
      { en: "Can I have the receipt, please?", th: "ขอใบเสร็จด้วยครับ/ค่ะ", slip: ["receipt", "recipe"] },
      { en: "Keep your receipt for returns.", th: "เก็บใบเสร็จไว้เผื่อคืนสินค้า", slip: ["returns", "return"] },
      { en: "I lost the receipt yesterday.", th: "ฉันทำใบเสร็จหายเมื่อวาน", slip: ["lost", "last"] },
    ],
  },
  {
    id: 8, word: "neighbor", ipa: "/ˈneɪ.bər/", pos: "คำนาม", meaning: "เพื่อนบ้าน", category: "home", level: "A1",
    tip: "gh ไม่ออกเสียง พูดว่า “NAY-ber”",
    sentences: [
      { en: "My neighbor has a cute dog.", th: "เพื่อนบ้านฉันมีหมาน่ารัก", slip: ["neighbor", "labor"] },
      { en: "Our neighbors are very friendly.", th: "เพื่อนบ้านเราเป็นมิตรมาก", slip: ["friendly", "friend"] },
      { en: "I said hello to my neighbor.", th: "ฉันทักทายเพื่อนบ้าน", slip: ["hello", "yellow"] },
    ],
  },
  {
    id: 9, word: "schedule", ipa: "/ˈskedʒ.uːl/", pos: "คำนาม", meaning: "ตารางเวลา", category: "work", level: "A2",
    tip: "สำเนียงอเมริกันพูด “SKED-jool” ส่วนอังกฤษพูด “SHED-yool”",
    sentences: [
      { en: "Let me check my schedule.", th: "ขอดูตารางเวลาก่อนนะ", slip: ["schedule", "school"] },
      { en: "The train is on schedule.", th: "รถไฟมาตรงเวลา", slip: ["train", "drain"] },
      { en: "I have a busy schedule this week.", th: "สัปดาห์นี้ตารางฉันแน่นมาก", slip: ["busy", "bossy"] },
    ],
  },
  {
    id: 10, word: "borrow", ipa: "/ˈbɑːr.oʊ/", pos: "คำกริยา", meaning: "ยืม", category: "social", level: "A1",
    tip: "เน้นพยางค์แรก “BAR-oh” อย่าสับสนกับ lend ที่แปลว่าให้ยืม",
    sentences: [
      { en: "Can I borrow your pen?", th: "ขอยืมปากกาหน่อยได้ไหม", slip: ["borrow", "bottle"] },
      { en: "I borrowed a book from Anna.", th: "ฉันยืมหนังสือจากแอนนา", slip: ["book", "look"] },
      { en: "You can borrow my umbrella.", th: "เธอยืมร่มฉันไปได้นะ", slip: ["umbrella", "umbrellas"] },
    ],
  },
  {
    id: 11, word: "laundry", ipa: "/ˈlɑːn.dri/", pos: "คำนาม", meaning: "เสื้อผ้าที่ต้องซัก", category: "home", level: "A2",
    tip: "พูดว่า “LAWN-dree” ไม่ใช่ “ลอน-ดรี้” สั้นๆ",
    sentences: [
      { en: "I do my laundry on Sunday.", th: "ฉันซักผ้าทุกวันอาทิตย์", slip: ["laundry", "lonely"] },
      { en: "The laundry is still wet.", th: "ผ้ายังไม่แห้งเลย", slip: ["wet", "what"] },
      { en: "Please fold the clean laundry.", th: "ช่วยพับผ้าที่ซักแล้วหน่อย", slip: ["fold", "hold"] },
    ],
  },
  {
    id: 12, word: "available", ipa: "/əˈveɪ.lə.bəl/", pos: "คำคุณศัพท์", meaning: "ว่าง พร้อมใช้", category: "work", level: "A2",
    tip: "เน้น “VAY” พยางค์ที่สอง “uh-VAY-luh-bul”",
    sentences: [
      { en: "Are you available this afternoon?", th: "บ่ายนี้คุณว่างไหม", slip: ["available", "a table"] },
      { en: "This size is not available.", th: "ไซซ์นี้ไม่มีของ", slip: ["size", "sighs"] },
      { en: "The room is available now.", th: "ห้องว่างแล้วตอนนี้", slip: ["room", "rum"] },
    ],
  },
  {
    id: 13, word: "delicious", ipa: "/dɪˈlɪʃ.əs/", pos: "คำคุณศัพท์", meaning: "อร่อย", category: "food", level: "A1",
    tip: "เน้น “LISH” ตรงกลาง “di-LISH-us”",
    sentences: [
      { en: "This soup is delicious.", th: "ซุปนี้อร่อยมาก", slip: ["soup", "soap"] },
      { en: "Thank you for the delicious dinner.", th: "ขอบคุณสำหรับมื้อเย็นแสนอร่อย", slip: ["dinner", "thinner"] },
      { en: "The mango looks delicious.", th: "มะม่วงน่ากินมาก", slip: ["looks", "locks"] },
    ],
  },
  {
    id: 14, word: "direction", ipa: "/daɪˈrek.ʃən/", pos: "คำนาม", meaning: "ทิศทาง เส้นทาง", category: "travel", level: "A2",
    tip: "พูดได้ทั้ง “dai-REK-shun” และ “di-REK-shun”",
    sentences: [
      { en: "Can you give me directions?", th: "ช่วยบอกทางหน่อยได้ไหม", slip: ["directions", "direction"] },
      { en: "We went in the wrong direction.", th: "เราไปผิดทาง", slip: ["wrong", "long"] },
      { en: "Follow the signs to the station.", th: "เดินตามป้ายไปที่สถานี", slip: ["station", "stations"] },
    ],
  },
  {
    id: 15, word: "refund", ipa: "/ˈriː.fʌnd/", pos: "คำนาม", meaning: "การคืนเงิน", category: "shopping", level: "B1",
    tip: "เป็นคำนามเน้น “REE-fund” เป็นคำกริยาเน้น “ri-FUND”",
    sentences: [
      { en: "I would like a refund, please.", th: "ฉันขอคืนเงินค่ะ/ครับ", slip: ["refund", "refill"] },
      { en: "The refund takes three days.", th: "การคืนเงินใช้เวลาสามวัน", slip: ["three", "free"] },
      { en: "Can I get a refund for this?", th: "ชิ้นนี้ขอคืนเงินได้ไหม", slip: ["this", "these"] },
    ],
  },
  {
    id: 16, word: "exhausted", ipa: "/ɪɡˈzɑː.stɪd/", pos: "คำคุณศัพท์", meaning: "เหนื่อยมาก หมดแรง", category: "social", level: "B1",
    tip: "h ไม่ออกเสียง พูดว่า “ig-ZAWS-tid”",
    sentences: [
      { en: "I am exhausted after work.", th: "เลิกงานแล้วฉันหมดแรงเลย", slip: ["exhausted", "exhaust"] },
      { en: "She looks exhausted today.", th: "วันนี้เธอดูเหนื่อยมาก", slip: ["looks", "look"] },
      { en: "We were exhausted from the trip.", th: "เราเหนื่อยจากการเดินทาง", slip: ["trip", "tree"] },
    ],
  },
  {
    id: 17, word: "reservation", ipa: "/ˌrez.ərˈveɪ.ʃən/", pos: "คำนาม", meaning: "การจอง", category: "travel", level: "A2",
    tip: "เน้น “VAY” พยางค์ที่สาม “rez-er-VAY-shun”",
    sentences: [
      { en: "I have a reservation for two.", th: "ฉันจองโต๊ะไว้สองที่", slip: ["reservation", "reservations"] },
      { en: "Can I change my reservation?", th: "ขอเปลี่ยนการจองได้ไหม", slip: ["change", "chain"] },
      { en: "We made a hotel reservation.", th: "เราจองโรงแรมไว้แล้ว", slip: ["made", "may"] },
    ],
  },
  {
    id: 18, word: "chores", ipa: "/tʃɔːrz/", pos: "คำนาม", meaning: "งานบ้าน", category: "home", level: "A2",
    tip: "ขึ้นต้นด้วยเสียง “ch” แบบ “ช” แล้วปิดด้วยเสียง z",
    sentences: [
      { en: "I finish my chores every morning.", th: "ฉันทำงานบ้านให้เสร็จทุกเช้า", slip: ["chores", "shores"] },
      { en: "Let's share the house chores.", th: "มาแบ่งงานบ้านกันเถอะ", slip: ["share", "chair"] },
      { en: "Washing dishes is my least favorite chore.", th: "ล้างจานเป็นงานบ้านที่ฉันชอบน้อยที่สุด", slip: ["dishes", "fishes"] },
    ],
  },
  {
    id: 19, word: "colleague", ipa: "/ˈkɑː.liːɡ/", pos: "คำนาม", meaning: "เพื่อนร่วมงาน", category: "work", level: "B1",
    tip: "พูดว่า “KAH-leeg” ตัว ue ท้ายคำไม่ออกเสียง",
    sentences: [
      { en: "My colleague helped me today.", th: "วันนี้เพื่อนร่วมงานช่วยฉันไว้", slip: ["colleague", "college"] },
      { en: "I had lunch with a colleague.", th: "ฉันกินข้าวเที่ยงกับเพื่อนร่วมงาน", slip: ["lunch", "launch"] },
      { en: "Our new colleague starts on Monday.", th: "เพื่อนร่วมงานใหม่เริ่มงานวันจันทร์", slip: ["starts", "start"] },
    ],
  },
  {
    id: 20, word: "spicy", ipa: "/ˈspaɪ.si/", pos: "คำคุณศัพท์", meaning: "เผ็ด", category: "food", level: "A1",
    tip: "ขึ้นต้นด้วย “sp” ติดกัน ไม่ใช่ “สะ-ไป”",
    sentences: [
      { en: "Is this dish very spicy?", th: "จานนี้เผ็ดมากไหม", slip: ["spicy", "spice"] },
      { en: "Not too spicy, please.", th: "ไม่เผ็ดมากนะ", slip: ["too", "two"] },
      { en: "I love spicy food.", th: "ฉันชอบอาหารเผ็ด", slip: ["food", "foot"] },
    ],
  },
  {
    id: 21, word: "luggage", ipa: "/ˈlʌɡ.ɪdʒ/", pos: "คำนาม", meaning: "กระเป๋าเดินทาง สัมภาระ", category: "travel", level: "A2",
    tip: "พูดว่า “LUG-ij” ไม่ใช่ “ลัก-เกจ”",
    sentences: [
      { en: "Where can I pick up my luggage?", th: "รับกระเป๋าได้ที่ไหน", slip: ["luggage", "language"] },
      { en: "My luggage is too heavy.", th: "กระเป๋าฉันหนักเกินไป", slip: ["heavy", "happy"] },
      { en: "Please watch my luggage.", th: "ช่วยดูกระเป๋าให้หน่อย", slip: ["watch", "wash"] },
    ],
  },
  {
    id: 22, word: "discount", ipa: "/ˈdɪs.kaʊnt/", pos: "คำนาม", meaning: "ส่วนลด", category: "shopping", level: "A1",
    tip: "เน้นพยางค์แรก “DIS-count”",
    sentences: [
      { en: "Is there a student discount?", th: "มีส่วนลดนักศึกษาไหม", slip: ["discount", "this count"] },
      { en: "I got a big discount today.", th: "วันนี้ฉันได้ส่วนลดเยอะเลย", slip: ["big", "bag"] },
      { en: "Members get a ten percent discount.", th: "สมาชิกได้ส่วนลดสิบเปอร์เซ็นต์", slip: ["Members", "member"] },
    ],
  },
  {
    id: 23, word: "invite", ipa: "/ɪnˈvaɪt/", pos: "คำกริยา", meaning: "เชิญ ชวน", category: "social", level: "A1",
    tip: "เน้นพยางค์หลัง “in-VITE”",
    sentences: [
      { en: "Thanks for inviting me.", th: "ขอบคุณที่ชวนนะ", slip: ["inviting", "invite"] },
      { en: "I want to invite you to dinner.", th: "ฉันอยากชวนคุณไปกินข้าวเย็น", slip: ["dinner", "diner"] },
      { en: "Did you invite your sister?", th: "เธอชวนพี่สาวมาหรือยัง", slip: ["sister", "sitter"] },
    ],
  },
  {
    id: 24, word: "convenient", ipa: "/kənˈviː.ni.ənt/", pos: "คำคุณศัพท์", meaning: "สะดวก", category: "social", level: "B1",
    tip: "เน้น “VEE” พยางค์ที่สอง “kun-VEE-nee-unt”",
    sentences: [
      { en: "Is Monday convenient for you?", th: "วันจันทร์สะดวกไหม", slip: ["convenient", "convenience"] },
      { en: "The station is very convenient.", th: "สถานีอยู่ในที่สะดวกมาก", slip: ["station", "nation"] },
      { en: "Online shopping is so convenient.", th: "ซื้อของออนไลน์สะดวกมาก", slip: ["shopping", "shipping"] },
    ],
  },
];

// The learner of this demo — a sample person.
export const learner = { name: "มายด์", goal: 3, startedOn: "2026-10-14" };

// One word a day: day 1 is the day the learner started; the order is a fixed shuffle so it feels random.
const DAY = 86_400_000;
const order = (() => {
  const ids = words.map((w) => w.id);
  let seed = 20261006;
  const rand = () => ((seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648) / 2_147_483_648);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  }
  return ids;
})();

export const dayKey = (d: Date) => new Date(d.getTime() + 7 * 3_600_000).toISOString().slice(0, 10); // Bangkok date
export const dayNumber = (key: string) => Math.round((Date.parse(key) - Date.parse(learner.startedOn)) / DAY) + 1;
export const wordOfDay = (key: string): Word => {
  const n = Math.max(1, dayNumber(key));
  return words.find((w) => w.id === order[(n - 1) % order.length])!;
};
export const dateOfDay = (n: number) => new Date(Date.parse(learner.startedOn) + (n - 1) * DAY).toISOString().slice(0, 10);

// Practice so far: every day since the start but one, today's word not yet — so the demo opens on a fresh word.
// The day missed is a week ago: the streak stands at 6, and practising today earns the 7-day medal on screen.
export const attempts: Attempt[] = [];
// Fills the practice history from the start again — on boot, and from "เริ่มเดโมใหม่".
export function seedAttempts(): void {
  attempts.length = 0;
  const today = dayNumber(dayKey(new Date()));
  const skipped = new Set([today - 7]);
  let id = 1;
  let seed = 7;
  const rand = () => ((seed = (seed * 16_807) % 2_147_483_647) / 2_147_483_647);
  for (let n = 1; n < today; n++) {
    if (skipped.has(n)) continue;
    const w = wordOfDay(dateOfDay(n));
    const base = Date.parse(dateOfDay(n)) + (12 + Math.floor(rand() * 10)) * 3_600_000 - 7 * 3_600_000;
    w.sentences.forEach((s, i) => {
      const tries = rand() < 0.45 ? 2 : 1;
      for (let t = 0; t < tries; t++) {
        const last = t === tries - 1;
        const missed = last && rand() < 0.75 ? [] : [s.slip[0]];
        const total = s.en.split(" ").length;
        const score = Math.round(((total - missed.length) / total) * 100);
        attempts.push({ id: id++, wordId: w.id, sentence: i, score, missed, at: new Date(base + (i * 3 + t) * 60_000).toISOString() });
      }
    });
  }
}
seedAttempts();
