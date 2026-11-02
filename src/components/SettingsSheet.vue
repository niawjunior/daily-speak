<script setup lang="ts">
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import { useRouter } from "vue-router";
import { Bell, BellRing, Download, RotateCcw, Settings, Smartphone } from "@lucide/vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { toneClass } from "@/data/words";
import { api } from "@/lib/api";
import { allow, eveningNote, install, installed, notify, permission } from "@/lib/pwa";
import { demoRound, settings } from "@/lib/settings";
import { canListen, say } from "@/lib/speech";

const permissionText = computed(() =>
  ({
    granted: "แจ้งเตือนเด้งบนหน้าจอเครื่องแม้ปิดแอปอยู่",
    denied: "ถูกปิดไว้ — เปิดได้ที่การตั้งค่าเว็บไซต์ของเบราว์เซอร์ ระหว่างนี้จะเตือนในแอปแทน",
    default: "ยังไม่ได้อนุญาต — จะเตือนในแอปแทน",
    unsupported: "เครื่องนี้ยังไม่รองรับ — จะเตือนในแอปแทน",
  })[permission.value],
);

// A sample of the evening reminder, as it would come at the time picked.
async function tryEvening(): Promise<void> {
  const note = await eveningNote(draft.value.eveningAt);
  if (!note) return void toast.error("ส่งแจ้งเตือนไม่สำเร็จ — ลองอีกครั้ง");
  open.value = false;
  const where = await notify(note);
  if (where === "phone") toast.success(`ส่งแจ้งเตือนไปที่เครื่องแล้ว — แบบที่จะได้รับตอน ${draft.value.eveningAt} น.`);
}

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
  const d = draft.value;
  const when = [d.remind && `เตือนคำใหม่ ${d.remindAt} น.`, d.evening && `เตือนตอนค่ำ ${d.eveningAt} น. ถ้ายังไม่ได้ฝึก`].filter(Boolean).join(" · ");
  toast.success(when ? `บันทึกแล้ว — ${when}` : "บันทึกการตั้งค่าแล้ว");
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
    <SheetContent side="bottom" class="mx-auto max-h-[92dvh] max-w-md overflow-y-auto rounded-t-2xl">
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
        <!-- The app on the phone, and its reminders -->
        <div class="flex flex-col gap-2">
          <Label>แอปและการแจ้งเตือน</Label>
          <div class="flex flex-col divide-y rounded-xl border bg-card">
            <div class="flex items-center justify-between gap-4 p-4">
              <div class="flex min-w-0 items-center gap-3">
                <Smartphone class="size-5 shrink-0 text-primary" />
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm font-medium">ติดตั้งบนหน้าจอโฮม</span>
                  <span class="text-xs text-muted-foreground">{{ installed ? "เปิดจากไอคอน Daily Speak ได้เลย" : "เปิดได้ในแตะเดียว ใช้ได้แม้สัญญาณไม่ดี" }}</span>
                </div>
              </div>
              <Badge v-if="installed" variant="outline" :class="toneClass.success">ติดตั้งแล้ว</Badge>
              <Button v-else variant="outline" class="h-9" @click="install"><Download /> ติดตั้ง</Button>
            </div>
            <div class="flex items-center justify-between gap-4 p-4">
              <div class="flex min-w-0 items-center gap-3">
                <BellRing class="size-5 shrink-0 text-primary" />
                <div class="flex flex-col gap-0.5">
                  <span class="text-sm font-medium">การแจ้งเตือนของเครื่อง</span>
                  <span class="text-xs text-muted-foreground">{{ permissionText }}</span>
                </div>
              </div>
              <Badge v-if="permission === 'granted'" variant="outline" :class="toneClass.success">เปิดแล้ว</Badge>
              <Button v-else variant="outline" class="h-9" @click="allow">อนุญาต</Button>
            </div>
            <div class="flex items-center justify-between gap-4 p-4">
              <div class="flex flex-col gap-0.5">
                <Label for="remind">เตือนคำใหม่ตอนเช้า</Label>
                <span class="text-xs text-muted-foreground">บอกคำของวันนี้พร้อมความหมาย</span>
              </div>
              <div class="flex items-center gap-3">
                <Select v-if="draft.remind" v-model="draft.remindAt">
                  <SelectTrigger class="h-9 w-24"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="t in ['07:00', '08:00', '09:00', '12:00']" :key="t" :value="t">{{ t }} น.</SelectItem>
                  </SelectContent>
                </Select>
                <Switch id="remind" v-model="draft.remind" />
              </div>
            </div>
            <div class="flex flex-col gap-3 p-4">
              <div class="flex items-center justify-between gap-4">
                <div class="flex flex-col gap-0.5">
                  <Label for="evening">เตือนตอนค่ำ ก่อนเสียวันติด</Label>
                  <span class="text-xs text-muted-foreground">ส่งเฉพาะวันที่ยังไม่ได้ฝึก</span>
                </div>
                <div class="flex items-center gap-3">
                  <Select v-if="draft.evening" v-model="draft.eveningAt">
                    <SelectTrigger class="h-9 w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="t in ['19:00', '20:00', '21:00', '22:00']" :key="t" :value="t">{{ t }} น.</SelectItem>
                    </SelectContent>
                  </Select>
                  <Switch id="evening" v-model="draft.evening" />
                </div>
              </div>
              <Button variant="outline" class="h-10 w-full" @click="tryEvening"><Bell /> ทดลองส่งแจ้งเตือนตอนค่ำ</Button>
            </div>
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
