// Public values only: everything here ships to every browser.
export const SITE = {
  title: "আলাপের প্রস্তুতি",
  description: "কঠিন আলাপের আগে কয়েকটা ঘরে প্রস্তুতি, আর পরে এক লাইনে কী হলো।",
  // For a local backend, set NEXT_PUBLIC_API_BASE=http://localhost:4000 in .env.local
  apiBase: process.env.NEXT_PUBLIC_API_BASE ?? "https://alap-prostuti-api.onrender.com",
  // A Google OAuth client ID is not a secret; the backend checks tokens against it
  googleClientId: "545912277528-cjh6m8easnefpg2i49je1uu0htq74htc.apps.googleusercontent.com",
};
