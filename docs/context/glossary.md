# Glossary

Words that mean one thing across the whole project — agreed with the developer
once, so nobody asks again. `/align-with-language` reads this first and adds to it.

**What goes here:** a term whose meaning holds for every task. A meaning agreed
for one task only stays in that chat. **Format:** `term` — meaning (source,
date). **Changing a meaning:** strike the old line through and add the new one
beside it, dated; never delete — why a meaning changed is worth keeping. Keep
the file under 50 lines; split by topic past that.

## প্রোডাক্ট

- `কঠিন আলাপ` — যে আলাপ মানুষ এড়িয়ে যান: অফিসে boss, সহকর্মী বা অধীনস্থের সাথে কঠিন কথা, দম্পতির টাকার আলাপ। নয়: small talk, কথা শুরু করা, লম্বা আড্ডা, body language (US/UK জরিপ; DESIGN.md · 2026-10-31)
- `ব্যবহারকারী` — বাংলাদেশে বাংলায় কথা বলা মানুষ; অন্য পক্ষ যে-কেউ, ঠিক হয় পরিস্থিতি দিয়ে। নয়: "সবাই", US/UK-এর মানুষ (developer · 2026-10-31)
- `প্রস্তুতি` — কঠিন আলাপের আগে চার ঘর (আমি কী চাই · আমার প্রথম বাক্য · অন্যজন কী বলতে পারেন · তখন আমি কী বলব), আর পরে এক লাইনে কী হলো। নয়: AI-এর সাথে মহড়া (DESIGN.md · 2026-10-31)
- `দরকারের মুহূর্তে` — ব্যবহার হয় কঠিন আলাপের আগে বা পরে; কত ঘন ঘন, প্রথম পাঁচজন থেকে মাপা। নয়: আগে থেকে ধরা "রোজ" (developer · 2026-10-31)
- `উন্নতি` — আসল কথোপকথনে আচরণ বদলানো, মাপা হয় app-এর বাইরে। নয়: app-এ কাটানো সময় বা streak (developer · 2026-10-31)

## প্রযুক্তি

- `backend app` — আলাদা deploy হওয়া, চলমান server program; free host-এ ঘুমায়, জাগতে এক মিনিট পর্যন্ত। নয়: serverless function (developer · 2026-10-31)
- `free` — মাসে ০ টাকা, সময়সীমা ছাড়া, credit card ছাড়া। নয়: trial বা প্রথম বছরের credit (developer · 2026-10-31)
- `provider` — hosting আর database-এর কোম্পানি, যাদের server-এ frontend, backend আর Postgres চলে। নয়: login-এর Google provider (developer · 2026-10-31)
- `frontend app` — build-এর সময় তৈরি static ফাইল, কোনো server-এ চলে না। নয়: server-side rendering (DESIGN.md · 2026-10-31)
- `scheduler` — backend-এর বাইরের জিনিস, যা দিনে একবার backup job চালায় আর ব্যর্থ হলে ইমেইল পাঠায়। নয়: backend-এর ভেতরের timer — ঘুমন্ত server-এ চলে না (DESIGN.md · 2026-10-31)
