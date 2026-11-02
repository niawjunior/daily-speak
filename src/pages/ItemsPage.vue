<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { statusLabel, type Item } from "@/data/items";
import { api } from "@/lib/api";

const items = ref<Item[] | null>(null);
const query = ref("");
const shown = computed(() => (items.value ?? []).filter((i) => `${i.name} ${i.owner}`.toLowerCase().includes(query.value.trim().toLowerCase())));
const when = (iso: string) => new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });

async function load(): Promise<void> {
  const { data, error } = await api.items.get();
  if (error) return void toast.error("โหลดรายการไม่ได้");
  items.value = data;
}
async function finish(item: Item): Promise<void> {
  const { data, error } = await api.items({ id: item.id }).patch({ status: "done" });
  if (error || !data || "error" in data) return void toast.error("บันทึกไม่ได้ — ลองอีกครั้ง");
  Object.assign(item, data);
  toast.success(`“${item.name}” เสร็จแล้ว`);
}
onMounted(load);
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="mr-auto text-2xl font-semibold tracking-tight">รายการ</h1>
      <Input v-model="query" placeholder="ค้นหาชื่อหรือผู้รับผิดชอบ" class="w-64" />
    </div>
    <div class="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ชื่อ</TableHead>
            <TableHead>ผู้รับผิดชอบ</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead>อัปเดต</TableHead>
            <TableHead class="w-28" />
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="!items">
            <TableRow v-for="n in 3" :key="n">
              <TableCell colspan="5"><Skeleton class="h-5 w-full" /></TableCell>
            </TableRow>
          </template>
          <TableRow v-for="i in shown" :key="i.id">
            <TableCell class="font-medium">{{ i.name }}</TableCell>
            <TableCell>{{ i.owner }}</TableCell>
            <TableCell><Badge :variant="i.status === 'done' ? 'secondary' : 'outline'">{{ statusLabel[i.status] }}</Badge></TableCell>
            <TableCell class="tabular-nums text-muted-foreground">{{ when(i.updatedAt) }}</TableCell>
            <TableCell class="text-right">
              <Button v-if="i.status !== 'done'" size="sm" variant="outline" @click="finish(i)">เสร็จ</Button>
            </TableCell>
          </TableRow>
          <TableRow v-if="items && !shown.length">
            <TableCell colspan="5" class="py-8 text-center text-muted-foreground">ไม่พบรายการที่ค้นหา</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </section>
</template>
