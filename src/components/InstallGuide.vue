<script setup lang="ts">
import { ref } from "vue";
import { EllipsisVertical, Share, SquarePlus } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { installGuide, isIOS } from "@/lib/pwa";

// How to put the app on the home screen by hand — iPhone (Safari) or Android (Chrome).
const icon = `${import.meta.env.BASE_URL}icon-192.png`;
const phone = ref<"ios" | "android">(isIOS ? "ios" : "android");
const steps = {
  ios: [
    { icon: Share, text: "เปิดเว็บนี้ใน Safari แล้วแตะปุ่ม “แชร์” ที่แถบด้านล่าง" },
    { icon: SquarePlus, text: "เลื่อนลงแล้วเลือก “เพิ่มไปยังหน้าจอโฮม”" },
    { icon: null, text: "แตะ “เพิ่ม” — ไอคอน Daily Speak จะอยู่บนหน้าจอโฮม เปิดแล้วอนุญาตการแจ้งเตือน" },
  ],
  android: [
    { icon: EllipsisVertical, text: "เปิดเว็บนี้ใน Chrome แล้วแตะเมนู ⋮ มุมขวาบน" },
    { icon: SquarePlus, text: "เลือก “ติดตั้งแอป” หรือ “เพิ่มไปยังหน้าจอหลัก”" },
    { icon: null, text: "แตะ “ติดตั้ง” — เปิดจากไอคอน Daily Speak ได้เหมือนแอปทั่วไป" },
  ],
};
</script>

<template>
  <Dialog v-model:open="installGuide">
    <DialogContent class="max-w-sm rounded-3xl">
      <DialogHeader class="items-center text-center">
        <img :src="icon" alt="" class="size-16 rounded-2xl shadow-md" />
        <DialogTitle class="font-heading text-xl">ติดตั้ง Daily Speak</DialogTitle>
        <DialogDescription>ไว้บนหน้าจอโฮม เปิดได้ในแตะเดียว ใช้ได้แม้สัญญาณไม่ดี และได้แจ้งเตือนก่อนเสียวันติด</DialogDescription>
      </DialogHeader>
      <div class="grid grid-cols-2 gap-1 rounded-xl bg-card p-1">
        <Button :variant="phone === 'ios' ? 'default' : 'ghost'" class="h-10" @click="phone = 'ios'">iPhone</Button>
        <Button :variant="phone === 'android' ? 'default' : 'ghost'" class="h-10" @click="phone = 'android'">Android</Button>
      </div>
      <ol class="flex flex-col gap-3">
        <li v-for="(s, i) in steps[phone]" :key="i" class="flex items-center gap-3 rounded-xl bg-background p-3 text-sm">
          <span class="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{{ (i + 1).toLocaleString("th-TH") }}</span>
          <span class="flex-1">{{ s.text }}</span>
          <component :is="s.icon" v-if="s.icon" class="size-5 shrink-0 text-primary" />
        </li>
      </ol>
      <Button class="h-11 w-full" @click="installGuide = false">เข้าใจแล้ว</Button>
    </DialogContent>
  </Dialog>
</template>
