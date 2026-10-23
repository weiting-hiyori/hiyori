# 小日和 Hiyori

行程、筆記、實驗紀錄和生活小天地，一個地方收好。
這是放在 GitHub Pages 上的獨立網站，資料存在你自己的 Supabase 專案裡。

## 怎麼用

1. 用 iPhone 的 Safari 打開網站網址，建立帳號（email + 密碼）並登入。
2. 點 Safari 下方的「分享」→「加入主畫面」→「加入」。
3. 從主畫面的小日和圖示打開，到「我的 → 手機提醒」按「打開通知」，選「允許」。
4. 之後設了提醒的行程和倒數日，時間到就會通知，網頁關掉也一樣。

電腦、平板用同一個帳號登入，就會看到同一份資料，改了會自動同步。
每一台想收通知的裝置，都要各自按一次「打開通知」。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| `index.html`、`app.js`、`art.css` | 網站本身 |
| `config.js` | 這個網站連到哪個 Supabase 專案（網址和公開金鑰） |
| `sw.js`、`manifest.webmanifest`、圖示 `*.png` | 加到主畫面、離線開啟、推播通知 |
| `supabase/schema.sql` | 資料表、權限（每個人只看得到自己的資料）、照片空間 |
| `supabase/functions/send-reminders/` | 每分鐘檢查到期的提醒並送出推播 |
| `supabase/cron.sql` | 每分鐘叫一次上面那個功能 |

## Supabase 設定（只需要做一次）

1. 在 SQL Editor 執行 `supabase/schema.sql`。
2. 部署 Edge Function `send-reminders`（`index.ts` + `webpush.js`），關掉 “Verify JWT”。
3. 把 `supabase/cron.sql` 裡的 `__PROJECT_URL__` 換成專案網址後執行。
4. Authentication → URL Configuration：Site URL 填這個網站的網址（例如 `https://你的帳號.github.io/hiyori/`），
   這樣確認信和重設密碼的連結才會回到小日和。
5. 把專案網址和 publishable key 填進 `config.js`（已經填好了）。
