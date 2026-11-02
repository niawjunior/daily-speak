<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { onMounted, ref } from "vue";
import type { Item } from "@/data/items";
import { api } from "@/lib/api";

const items = ref<Item[]>([]);
const counts = () => [
  { label: "ทั้งหมด", value: items.value.length },
  { label: "กำลังทำ", value: items.value.filter((i) => i.status === "in_progress").length },
  { label: "เสร็จแล้ว", value: items.value.filter((i) => i.status === "done").length },
];
onMounted(async () => {
  const { data } = await api.items.get();
  if (data) items.value = data;
});
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-3xl font-semibold tracking-tight">ยินดีต้อนรับ</h1>
      <p class="text-muted-foreground">หน้าตั้งต้นของเดโม — Claude จะเปลี่ยนหน้านี้ตามที่เล่าไว้</p>
    </div>
    <div class="grid gap-4 sm:grid-cols-3">
      <Card v-for="c in counts()" :key="c.label">
        <CardHeader>
          <CardDescription>{{ c.label }}</CardDescription>
          <CardTitle class="text-3xl tabular-nums">{{ c.value }}</CardTitle>
        </CardHeader>
      </Card>
    </div>
    <Card>
      <CardHeader>
        <CardTitle>เริ่มต้น</CardTitle>
        <CardDescription>ดูรายการตัวอย่าง แล้วบอก Claude ว่าอยากให้เป็นแบบไหน</CardDescription>
      </CardHeader>
      <CardContent>
        <Button as-child><RouterLink to="/items">ดูรายการ</RouterLink></Button>
      </CardContent>
    </Card>
  </section>
</template>
