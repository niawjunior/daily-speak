// Sample data for the demo — kept in memory: a restart starts again from here. Replace with what the client's case needs.
export interface Item {
  id: number;
  name: string;
  status: "open" | "in_progress" | "done";
  owner: string;
  updatedAt: string;
}

export const items: Item[] = [
  { id: 1, name: "ตรวจสอบเอกสารสัญญา", status: "open", owner: "สมชาย", updatedAt: "2026-10-01T09:00:00.000Z" },
  { id: 2, name: "อนุมัติใบสั่งซื้อ", status: "in_progress", owner: "สมหญิง", updatedAt: "2026-10-02T10:30:00.000Z" },
  { id: 3, name: "ส่งรายงานประจำเดือน", status: "done", owner: "วิชัย", updatedAt: "2026-10-03T15:45:00.000Z" },
];
