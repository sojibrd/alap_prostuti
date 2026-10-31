# alap_prostuti — Agent Instructions

কঠিন আলাপের আগে প্রস্তুতি লেখার app। design আর প্রতিটা সিদ্ধান্তের কারণ `DESIGN.md`-এ, শব্দের মানে `docs/context/glossary.md`-এ — কাজের আগে দুটোই পড়ুন।

- **গড়ন** — `frontend/` (Next.js static export → GitHub Pages) আর `backend/` (Express + TypeScript → Render, root directory `backend/`)। API-র type থাকে `backend/`-এর ভেতরে, frontend সেখান থেকে import করে — Render `backend/`-এর বাইরের ফাইল দেখে না।
- **ব্যবহারকারীর লেখা কখনো repo, log বা চ্যাটে নয়।** error log-এ শুধু error, request body নয়।
- **secret শুধু env-এ** — local-এ `.env` (git-এর বাইরে), deploy-এ Render আর GitHub-এর secret। `.env.example`-এ শুধু নাম।
- **প্রতিটা database query ব্যবহারকারীর id দিয়ে**, একটা access স্তর দিয়েই — route থেকে সরাসরি table-এ query নয়।
- **Neon** — app-এ pooled `DATABASE_URL` (host-এ `-pooler`); migration আর `pg_dump`-এ direct (`DATABASE_URL_UNPOOLED`), `-pooler` ছাড়া। code নিজেই `sslmode=verify-full` বসায় (`src/db/url.ts`)।
- **`neon env pull`** — `backend/`-এ `neon env pull --file .env`। এটা AI Gateway-র token-ও আনে (আর নতুন বানায়); এই app-এ AI নেই, তাই `NEON_AI_GATEWAY_*` লাইন `.env` থেকে মুছে দিন।
- **migration** — `schema.ts` বদলান → `npm run db:generate -- --name <নাম>` → তৈরি SQL পড়ে দেখুন → `npm run db:migrate`। `drizzle/` repo-তে থাকে; হাতে সম্পাদনা নয়।
- **role** — app চলে `app_user` দিয়ে, backup `backup_reader` দিয়ে, migration `neondb_owner` দিয়ে (`backend/sql/roles.sql`)। নতুন table যোগ হলে `app_user`-এর দরকারি grant ঐ ফাইলে যোগ করে ব্যবহারকারীকে চালাতে দিন — নইলে app-এ "permission denied"। `backup_reader` নতুন table নিজেই পায় (default privileges)। Console, CLI বা API দিয়ে role নয় — ওগুলো `neon_superuser` পায়।
- **test** — `backend/`-এ `npm test` (vitest)। database PGlite (WASM-এ আসল Postgres, in-memory), repo-র `drizzle/` migration দিয়ে — Neon বা কোনো secret লাগে না। PGlite চালু হতে কয়েক সেকেন্ড, তাই প্রতি test ফাইলে database একটাই, প্রতি `describe`-এ আলাদা app আর আলাদা নামের ব্যবহারকারী। role-এর grant PGlite যাচাই করে না — ওটা Neon-এ আলাদা করে দেখা।
- **free tier ঘুমায়** — backend ১৫ মিনিট চুপচাপে, database ৫ মিনিটে। `/health` database ছোঁয় না, যাতে Render-এর health check database জাগিয়ে না রাখে।
- **Skill** — backend-এ `nodejs-backend-patterns`, database-এ `supabase-postgres-best-practices` আর `neon-postgres`। frontend `nextjs-pages`-এর গড়নে, কিন্তু রং light আর dark দুটোই, ফোনের system setting অনুযায়ী।
