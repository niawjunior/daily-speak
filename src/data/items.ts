// The shape of an item and its words on screen — the items themselves come from the API (server/data.ts).
export interface Item {
  id: number;
  name: string;
  status: "open" | "in_progress" | "done";
  owner: string;
  updatedAt: string;
}


export const statusLabel: Record<Item["status"], string> = { open: "รอดำเนินการ", in_progress: "กำลังทำ", done: "เสร็จแล้ว" };
