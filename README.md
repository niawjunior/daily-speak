<!-- sup-plana:about -->
# ทำ app สำหรับฝึกภาษาอังกฤษ สำหรับใช้บน mobile…

เดโม · โดย เนี้ยว — สร้างและแก้ต่อด้วย Claude จากหน้า Claude › แอป ของ sup-plana

ลิงก์: `/app-mobile/` · build: `BASE_PATH=/app-mobile/ bun run build`
<!-- /sup-plana:about -->

สร้างจาก starter **vue-elysia** ของ sup-plana — Claude สร้างและแก้ต่อจากหน้า Claude › แอป

```sh
bun install
bun run dev      # the app, with hot reload
bun run check    # typecheck + build
bun run start    # the built page and the API on one port
BASE_PATH=/<name>/ bun run build   # deployed under a path (sales-demo/<name>/); start it with the same BASE_PATH
```
