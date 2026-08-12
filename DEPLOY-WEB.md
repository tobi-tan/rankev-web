# Deploy Rankev Web (Vite → Vercel · Fastify → Railway · Ảnh → Cloudflare R2)

> Prompt gốc viết cho **Create React App**, nhưng frontend thật là **Vite**. File này là
> bản đã chỉnh cho đúng Vite. Các khác biệt chính:
> - Biến môi trường: **`VITE_API_URL`** (không phải `REACT_APP_API_URL`).
> - `index.html` nằm ở **root** repo (không phải `public/index.html`); file tĩnh để trong `public/`.
> - Vercel Framework Preset: **Vite** (không phải Create React App).
> - Procfile backend chạy **`dist/server.js`** (không phải `index.js`).

## Đã chuẩn bị sẵn trong code (không cần làm lại)

**Frontend (`rankev-web`)**
- `index.html` — thêm manifest, theme-color, meta iOS "Add to Home Screen", apple-touch-icon.
- `public/manifest.json` — PWA.
- `public/icon-192.png`, `public/icon-512.png` — sinh bằng `node scripts/gen-icons.mjs` (nền vàng, chữ R).
- `vercel.json` — preset Vite + SPA rewrite (đã chừa file tĩnh `.png/.json` không bị rewrite về index).
- `.env.production` — `VITE_API_URL` (nhớ đổi thành URL Railway thật sau khi deploy backend).
- `src/api.js` — `BASE_URL` đã đọc `import.meta.env.VITE_API_URL`.

**Backend (`rankev-backend`)**
- `/health` → `{ status, uptime, timestamp }`.
- CORS đọc `CORS_ORIGIN` (danh sách origin, phân cách bằng dấu phẩy).
- `Procfile` → `web: node dist/server.js`.
- Upload: R2 nếu cấu hình đủ 5 biến `R2_*`, ngược lại lưu local disk (dev). Xem `src/modules/uploads/storage.ts`.
- `.env.example` — đầy đủ biến kể cả `R2_*`, `PUBLIC_BASE_URL`.

## Việc bạn phải tự làm (cần tài khoản/credential của bạn)

### 1. Đưa 2 repo lên GitHub
```bash
# backend
cd rankev-backend && git init && git add -A && git commit -m "Rankev backend" && git branch -M main
git remote add origin https://github.com/<bạn>/rankev-backend.git && git push -u origin main
# frontend
cd ../rankev-web && git init && git add -A && git commit -m "Rankev web" && git branch -M main
git remote add origin https://github.com/<bạn>/rankev-web.git && git push -u origin main
```
`.env` (backend, chứa DB password + JWT secret) đã nằm trong `.gitignore` — KHÔNG bị đẩy lên.

### 2. Backend lên Railway
1. railway.app → New Project → Deploy from GitHub → chọn `rankev-backend`.
2. Add Plugin → PostgreSQL (Railway tự sinh `DATABASE_URL`).
3. Variables: thêm `JWT_SECRET` (chuỗi ngẫu nhiên dài), `NODE_ENV=production`, `CORS_ORIGIN=https://<app>.vercel.app`, và (khi có R2) 5 biến `R2_*`.
4. Settings → Generate Domain → copy URL (vd `rankev-api.up.railway.app`).
5. Chạy migration: Railway Console → `npm run db:migrate` (và `npm run db:seed` nếu muốn dữ liệu mẫu).

### 3. Frontend lên Vercel
1. vercel.com → New Project → Import `rankev-web`. Preset tự nhận **Vite**.
2. Environment Variables → `VITE_API_URL = https://rankev-api.up.railway.app` (URL Railway ở bước 2).
3. Deploy → nhận URL (vd `rankev.vercel.app`).
4. Quay lại Railway, đặt `CORS_ORIGIN` = đúng URL Vercel này, redeploy backend.

### 4. Cloudflare R2 (ảnh không mất khi redeploy)
1. Cloudflare → R2 → Create Bucket `rankev-uploads`.
2. Settings → Public Access → Allow → copy **Public Bucket URL** → `R2_PUBLIC_URL`.
3. Manage R2 API Tokens → Create (Read & Write) → lấy Account ID, Access Key ID, Secret Access Key.
4. Điền `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` vào Railway → redeploy.

### 5. Kiểm tra
```bash
API_URL=https://rankev-api.up.railway.app WEB_URL=https://rankev.vercel.app node check-deployment.js
```
(script nằm ở repo `rankev-backend`). Kỳ vọng: 6/6 ✅.

Trên iPhone: Safari → mở URL Vercel → Share → **Add to Home Screen** → icon Rankev lên màn hình.
