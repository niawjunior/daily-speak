<script setup lang="ts">
import { ref } from "vue";
import { toast } from "vue-sonner";
import { useRouter } from "vue-router";
import { RotateCcw, Settings } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { demoRound, settings } from "@/lib/settings";
import { canListen, say } from "@/lib/speech";

const router = useRouter();
const open = ref(false);
const draft = ref({ ...settings.value });
const speeds = [
  { value: 0.7, label: "ช้า" },
  { value: 0.9, label: "ปกติ" },
  { value: 1.1, label: "เร็ว" },
];

function opened(v: boolean): void {
  if (v) draft.value = { ...settings.value };
  open.value = v;
}
function save(): void {
  settings.value = { ...draft.value };
  open.value = false;
  toast.success(draft.value.remind ? `บันทึกแล้ว — จะเตือนให้ฝึกทุกวันเวลา ${draft.value.remindAt} น.` : "บันทึกการตั้งค่าแล้ว");
}
async function reset(): Promise<void> {
  const { error } = await api.reset.post();
  if (error) return void toast.error("เริ่มเดโมใหม่ไม่สำเร็จ — ลองอีกครั้ง");
  open.value = false;
  toast.success("เริ่มเดโมใหม่แล้ว — คำของวันนี้รอให้ฝึกอีกครั้ง");
  await router.replace("/");
  demoRound.value++;
}
</script>

<template>
  <Sheet :open="open" @update:open="opened">
    <SheetTrigger as-child>
      <Button variant="ghost" size="icon-lg" class="size-11" aria-label="ตั้งค่า"><Settings class="size-5" /></Button>
    </SheetTrigger>
    <SheetContent side="bottom" class="mx-auto max-w-md rounded-t-2xl">
      <SheetHeader>
        <SheetTitle class="font-heading text-lg">ตั้งค่าการฝึก</SheetTitle>
        <SheetDescription>เลือกสำเนียง ความเร็วเสียงตัวอย่าง และตัวตรวจการออกเสียง</SheetDescription>
      </SheetHeader>
      <div class="flex flex-col gap-6 px-4">
        <div class="flex flex-col gap-2">
          <Label>สำเนียง</Label>
          <Select v-model="draft.accent">
            <SelectTrigger class="h-11 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en-US">อเมริกัน (US)</SelectItem>
              <SelectItem value="en-GB">อังกฤษ (UK)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex flex-col gap-2">
          <Label>ความเร็วเสียงตัวอย่าง</Label>
          <div class="grid grid-cols-3 gap-2">
            <Button v-for="s in speeds" :key="s.value" :variant="draft.rate === s.value ? 'default' : 'outline'" class="h-11"
              @click="draft.rate = s.value; say('Good morning, how are you?', draft.accent, s.value)">
              {{ s.label }}
            </Button>
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <Label>ตัวตรวจการออกเสียง</Label>
          <div class="grid grid-cols-2 gap-2">
            <Button :variant="draft.checker === 'google' ? 'default' : 'outline'" class="h-11" @click="draft.checker = 'google'">Google Speech-to-Text</Button>
            <Button :variant="draft.checker === 'sim' ? 'default' : 'outline'" class="h-11" @click="draft.checker = 'sim'">โหมดจำลอง</Button>
          </div>
          <p class="text-xs text-muted-foreground">
            {{ canListen ? "Google ฟังเสียงจริงจากไมโครโฟน · โหมดจำลองใช้ตอนนำเสนอที่ไม่มีไมค์ ระบบจะ “ได้ยิน” ประโยคให้เอง" : "เบราว์เซอร์นี้ฟังเสียงจากไมค์ไม่ได้ — จะใช้โหมดจำลองให้อัตโนมัติ (ใช้ Chrome หรือ Safari เพื่อฟังเสียงจริง)" }}
          </p>
        </div>
        <div class="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
          <div class="flex flex-col gap-1">
            <Label for="remind">เตือนให้ฝึกทุกวัน</Label>
            <span class="text-xs text-muted-foreground">แจ้งเตือนเมื่อมีคำใหม่ของวัน</span>
          </div>
          <div class="flex items-center gap-3">
            <Select v-if="draft.remind" v-model="draft.remindAt">
              <SelectTrigger class="h-9 w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="t in ['07:00', '08:00', '12:00', '18:00', '21:00']" :key="t" :value="t">{{ t }} น.</SelectItem>
              </SelectContent>
            </Select>
            <Switch id="remind" v-model="draft.remind" />
          </div>
        </div>
      </div>
      <SheetFooter class="gap-2 pb-6">
        <Button class="h-11 w-full" @click="save">บันทึกการตั้งค่า</Button>
        <Button variant="ghost" class="h-11 w-full text-muted-foreground" @click="reset"><RotateCcw /> เริ่มเดโมใหม่ — ล้างผลที่ฝึกวันนี้</Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</template>
