# alap-prostuti — System Design

> তৈরি: 2026-10-31 · স্তর: small
> **সারাংশ**: কঠিন আলাপের আগে মানুষ বাংলায় কয়েকটা ছোট ঘরে প্রস্তুতি লেখেন, আর পরে এক লাইনে লেখেন কী হলো — AI ছাড়া।
> **Stack**: static frontend (GitHub Pages) · backend app, REST (Render) · managed Postgres (Neon) — সবই free tier; Google login; নিজের দৈনিক backup
> **হালনাগাদ**: 2026-10-31 — provider ঠিক হলো (`architect`): Supabase-এর "৭ দিনে pause"-এর জায়গায় Neon-এর ঘুম আর মাসের সীমা
> **বাদ দেওয়া হয়েছে**: cache, queue, replica/failover, load balancer, CDN, sharding, resiliency, uptime ping, AI

## ১. কী বানাচ্ছি

"কঠিন আলাপ" — যে আলাপ মানুষ এড়িয়ে যান: অফিসে boss, সহকর্মী বা অধীনস্থের সাথে কঠিন কথা, দম্পতির টাকার আলাপ। অন্য পক্ষ যে-কেউ হতে পারেন; ঠিক হয় পরিস্থিতি দিয়ে, সম্পর্ক দিয়ে নয়। ব্যবহারকারী বাংলাদেশে বাংলায় কথা বলা মানুষ; ব্যবহার "দরকারের মুহূর্তে" — আলাপের আগে বা পরে। এটা CV-র প্রমাণ-প্রজেক্ট: সত্যিকারের ব্যবহারকারী, পাঁচজন হলেও।

ভিত্তি শুধু US/UK-এর জরিপ — Bravely (৭০% অফিসকর্মী কঠিন আলাপ এড়িয়েছেন), CMI (৫৭% প্রায় যেকোনো কিছু করেন এড়াতে), Marriage.com ২০২৬ (প্রায় চারটার একটা দম্পতি টাকার আলাপ এড়ান); সংখ্যাগুলো খবরের লেখা থেকে, মূল রিপোর্ট খোলা হয়নি। তিনজনের সাক্ষাৎকার নেওয়া হয়েছিল, কিন্তু প্রমাণ হিসেবে বাদ (ব্যবহারকারী, 2026-10-31)।

**খোলা (⏳)**: বাংলাদেশের মানুষের এই সমস্যা আছে কিনা · মানুষ কত ঘন ঘন ব্যবহার করবেন — প্রথম পাঁচজন থেকে মাপা হবে · কখন বানানো আর ৭ ঘণ্টার কোন কাজ কমবে, "ফাঁদ"-এর প্রশ্ন, আর fullstack বনাম `leave_management`-এর রূপান্তর — `brainstorming/thought-map.md`, "অমিল › খোলা"।

**Functional**:
- Google দিয়ে login করা
- প্রস্তুতি লেখা: আমি কী চাই · আমার প্রথম বাক্য · অন্যজন কী বলতে পারেন · তখন আমি কী বলব
- আলাপের পরে এক লাইনে লেখা কী হলো
- নিজের প্রস্তুতির তালিকা দেখা, খোলা, বদলানো
- নিজের প্রস্তুতি আর account মুছে ফেলা
- প্রতি ব্যবহারকারী কতবার প্রস্তুতি লিখলেন গোনা — শুধু সংখ্যা, লেখা নয়; দেখবেন শুধু মালিক
- পুরো interface বাংলায়

**Non-functional**: latency — Core Web Vitals "good" p75-এ (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1); save p95 < 1s যখন backend জেগে, কিছুক্ষণ চুপচাপের পরে প্রথম request-এ এক মিনিট পর্যন্ত · availability 99%; database-এর মাসের compute সীমা পেরোলে মাসের বাকি সময় বন্ধ · ডেটা হারানো: এক দিনের বেশি নয় · ফাঁস: অগ্রহণযোগ্য — লেখা দেখেন শুধু লেখক

## ২. স্কেল (অনুমান — সব সিদ্ধান্ত এখান থেকে)
DAU ~৩০ · write ~১২০/দিন · read ~৩০০/দিন · peak ~০.০৩৫ QPS · ৫ বছরে ~২৭০ MB

ধরা হয়েছে: ১০০ জন ব্যবহারকারী (ওপরের সীমা, আশা নয়), প্রত্যেকে সপ্তাহে ২টা প্রস্তুতি, সপ্তাহে ২ দিন খোলেন; প্রতিটা প্রস্তুতিতে ~৪টা write আর ~১০টা read; একটা প্রস্তুতি ~৫ KB (~১,৪০০ বাংলা অক্ষর × UTF-8-এ ৩ byte, সাথে metadata)। দশ গুণ হলেও peak ~০.৩৫ QPS, ডেটা ~২.৭ GB — স্তর একই থাকে।

> ভুল প্রমাণিত হলে ধারা ৩ আবার দেখতে হবে।

## ৩. সিদ্ধান্ত

অধ্যায় = system design সাইটগুলোর `guide/`-এর নম্বর।

| সিদ্ধান্ত | কী ঠিক হলো | কেন | trade-off | অধ্যায় |
|---|---|---|---|---|
| CP না AP | একটা Postgres, তাই CP | database একটা — partition-এর প্রশ্ন নেই | — | ০৪, ০৫ |
| Data model + database | managed Postgres, শেয়ার্ড progress-এর Supabase project থেকে আলাদা নতুন project | ছোট, সম্পর্কের ডেটা: ব্যবহারকারী → প্রস্তুতি; গোনা = প্রস্তুতির সারি গোনা | আরেকটা project চালু রাখা, free tier-এর সীমা; শেয়ার্ড project-এর policy খোলা, তাই ব্যক্তিগত লেখা ওখানে নয় | ১২ |
| কয় ভাগে | আলাদা frontend app, backend app আর database — সবই free host-এ | ব্যবহারকারীর সিদ্ধান্ত | দুটো deploy; free backend ঘুমায় ([Render](https://render.com/free): ১৫ মিনিট চুপচাপে বন্ধ, জাগতে "up to a minute"); free database ঘুমায় ([Neon](https://neon.com/docs/introduction/plans): ৫ মিনিট চুপচাপে compute বন্ধ, পরের connection-এ নিজে চালু; মাসে 100 CU-hours, পেরোলে মাসের বাকি সময় বন্ধ; জায়গা ডকে 0.5 GB, আমাদের project-এ branch-এর সীমা 1 GiB — 2026-10-31) | ১০ |
| API | HTTPS-এর ওপর REST, JSON | resource দুটো, কাজ সরল | প্রতি পাতার request আলাদা করে ঠিক করা | ১৫ |
| Login | Google | free; password রাখতে হয় না | Google account ছাড়া ঢোকা যায় না; login Google-এর ওপর নির্ভর | ২৫ |
| কে লেখা পড়ে | backend শুধু লেখককে তাঁর লেখা দেখায়; মালিক দেখেন শুধু সংখ্যা; ব্যবহারকারীকে সোজা কথায় জানানো — database-এর মালিক চাইলে পড়তে পারেন, পড়েন না | স্কোপ ছোট; "হারানো নয়"-এর সাথে সংঘাত নেই | সুরক্ষা নিয়মে, প্রযুক্তিতে নয়; database-এর চাবি ফাঁস হলে সব লেখা পড়া যায় | ২৫ |
| Monitoring | প্রস্তুতি গোনা (সপ্তাহে একবার নিজে দেখা); আসল browser থেকে Core Web Vitals backend-এ; backend-এর error log; alert — backup job ব্যর্থ হলে ইমেইল; database-এর মাসের সীমার কাছে গেলে Neon জানায় কিনা, যাচাই বাকি | পাঁচজনের জন্য যথেষ্ট; server ঘুমাতে পারে | backend বন্ধ থাকলে কেউ জানায় না | ১৮ |
| Backup | নিজের দৈনিক job — database-এর কপি, encrypt করে আলাদা গোপন জায়গায়; মাসে একবার ফিরিয়ে এনে যাচাই; encryption চাবির আলাদা কপি | free tier-এ provider-এর backup-এর ওপর ভরসা নয় — Supabase-এর free plan-এ automatic backup নেই ([Supabase pricing](https://supabase.com/pricing)); Neon-এর free project-এ ইতিহাস মাত্র ৬ ঘণ্টা (`history_retention_seconds` 21600, 2026-10-31) — এক দিনের নিজের backup-এর বদলি নয় | বড়জোর এক দিনের লেখা হারাতে পারে; দিনে একবার চলা একটা job লাগে | ০৬, ২২ |
| দুবার save | প্রস্তুতির id browser-এ তৈরি; একই id দুবার এলে server একটাই রাখে | ঘুমন্ত server-এ timeout-এর পরে browser আবার পাঠাতে পারে | — | ১৬ |

## ৪. যা ইচ্ছাকৃতভাবে বাদ দিলাম
| বাদ | কেন | কখন ফিরে আসবেন |
|---|---|---|
| Cache | read QPS ~০.০০৩৫ | read QPS > ৫০০, বা p95 লক্ষ্য না মিললে |
| Queue | ১ সেকেন্ডের বেশি কাজ নেই, AI নেই; শুধু দৈনিক backup job | AI বা ইমেইলের মতো লম্বা বা বাইরের কাজ যোগ হলে |
| পুরো idempotency | টাকা বা webhook নেই; browser-এর id-ই যথেষ্ট | payment বা webhook এলে |
| Replica / failover | availability 99%, ঘুম মেনে নেওয়া | availability লক্ষ্য ≥ 99.9% হলে |
| Load balancer | একটা server যথেষ্ট | peak > ~১০০ QPS |
| CDN | বড় asset নেই, ব্যবহারকারী এক দেশে | ছবি বা ভিডিও এলে, বা অন্য মহাদেশের ব্যবহারকারী |
| Sharding | দশ গুণেও ~২.৭ GB | ডেটা > ১ TB |
| Resiliency | payment, email বা third-party API-র ওপর নির্ভরতা নেই | বাইরের কোনো API যোগ হলে |
| Uptime ping | server জাগিয়ে রাখে — ঘুম মেনে নেওয়ার উল্টো | paid host নিলে |
| AI দিয়ে মহড়া | "Stage 1-এ AI নিয়ে নতুন কাজ নেই" (`brainstorming/soft-technical-and-ai-skill.md`); ইংরেজিতে এমন app অনেক | ব্যবহারকারী চাইলে |
| Field বা end-to-end encryption | স্কোপ বড়; চাবি হারালে লেখা হারায় | ব্যবহারকারী পাঁচজন ছাড়ালে, বা অচেনা মানুষ এলে |
| ফোনে OTP | SMS-এ টাকা লাগে | paid হলে |

## ৫. আর্কিটেকচার
```
            Google (login)
               ▲
               │ login
               │
Browser ── frontend app (static, free host)
               │
               │ HTTPS · REST/JSON · প্রতি request-এ login-এর প্রমাণ
               ▼
        backend app (free host · ঘুমায়)
          · শুধু লেখককে তাঁর লেখা দেখায়
          · মালিককে শুধু গোনার সংখ্যা
          · Core Web Vitals আর error log জমা রাখে
               │
               ▼
        Postgres (managed · free · ঘুমায়)
               │
               │ দিনে একবার কপি, encrypt করে
               ▼
        backup job ──► আলাদা গোপন জায়গা
```

## ৬. যেখানে ভাঙবে
- Google login বন্ধ → নতুন login হয় না; আগে থেকে ঢোকা মানুষের চলে → মেনে নেওয়া
- frontend host বন্ধ → কিছুই খোলে না → মেনে নেওয়া (availability 99%)
- backend ঘুমিয়ে → প্রথম request-এ এক মিনিট পর্যন্ত; কঠিন আলাপের ঠিক আগে লেখা হারানোর ঝুঁকি → server "save হয়েছে" না বলা পর্যন্ত লেখা browser-এ থাকে; পাতায় "server জাগছে"
- Postgres ঘুমিয়ে → প্রথম query-তে জাগার দেরি, backend জাগার দেরির সাথে যোগ হয় → মেনে নেওয়া
- Postgres-এর মাসের compute সীমা পেরোল → মাসের বাকি সময় পুরো app বন্ধ → মেনে নেওয়া; পাঁচজনে সীমার অনেক নিচে থাকার কথা (নিশ্চিত না — প্রথম মাসে মেপে দেখা)
- Postgres-এর ডেটা নষ্ট → দৈনিক backup থেকে ফেরানো; বড়জোর এক দিনের লেখা হারায়
- backup job চুপচাপ ব্যর্থ → কয়েক দিন backup নেই → ব্যর্থ হলে ইমেইল (scheduler নিজে পাঠায় কিনা, `architect`-এ যাচাই); মাসে একবার ফিরিয়ে এনে দেখা
- backup ফাঁস → সবার লেখা বাইরে → encrypt করা; চাবি backup-এর জায়গা থেকে আলাদা
- database-এর চাবি ফাঁস → সব লেখা পড়া যায় → মেনে নেওয়া (নিয়মে সুরক্ষা); চাবি শুধু backend-এর গোপন সেটিংয়ে, ফাঁস হলে সাথে সাথে বদলানো
- একই save দুবার, বা timeout → একই প্রস্তুতি দুবার → browser-এ তৈরি id; server একটাই রাখে
- বাংলা web font বড় → LCP আর CLS খারাপ → font কীভাবে আসবে, `architect`-এ

Antipattern যাচাই (অধ্যায় ১৭): Chatty I/O — তালিকা এক request-এ; Extraneous Fetching — তালিকায় শুধু শিরোনাম আর তারিখ, গোনা database-এ গুনে; Busy Database — এই স্কেলে ঝুঁকি নেই; Retry Storm — server জাগার সময় একবারই আবার চেষ্টা, বিরতি দিয়ে, পাতায় অবস্থা দেখিয়ে।

**SPOF**: backend (একটাই, ঘুমায়) · Postgres (একটাই, ঘুমায়, মাসের সীমা আছে) · Google login · backup-এর encryption চাবি — সবই জেনেশুনে মেনে নেওয়া।
