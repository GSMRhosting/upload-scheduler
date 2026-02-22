# Upload Scheduler (Email Version) — Setup Guide
## ~20 minutes · No coding · All free

---

## ACCOUNTS YOU NEED
- Supabase (free) → supabase.com
- GitHub (free) → github.com
- Vercel (free) → vercel.com
- Gmail account (you probably already have one)

---

## STEP 1 — Supabase (your database)

1. Go to supabase.com → Start your project → sign up free
2. Click "New Project" → name it "upload-scheduler" → pick a region → create a password → click Create
3. Wait ~2 minutes for it to set up
4. Click "SQL Editor" in the left sidebar → "New query"
5. Delete anything in the box, paste this, click Run:

```sql
create table posts (
  id uuid default gen_random_uuid() primary key,
  date text not null,
  title text not null,
  link text default '',
  caption text default '',
  clients text[] default '{}',
  created_at timestamp with time zone default now()
);

create table staff (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  created_at timestamp with time zone default now()
);

create table clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  color text not null default '#FFE66D',
  created_at timestamp with time zone default now()
);

alter table posts enable row level security;
alter table staff enable row level security;
alter table clients enable row level security;

create policy "Allow all" on posts for all using (true) with check (true);
create policy "Allow all" on staff for all using (true) with check (true);
create policy "Allow all" on clients for all using (true) with check (true);
```

6. Go to Project Settings → API. Copy and save these 3 values:
   - Project URL → label it: NEXT_PUBLIC_SUPABASE_URL
   - anon/public key → label it: NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service_role key → label it: SUPABASE_SERVICE_ROLE_KEY

---

## STEP 2 — Gmail App Password (so the app can send emails)

Your app will send emails FROM your Gmail account. Gmail requires a special
"App Password" for this — it's NOT your normal Gmail password.

1. Go to myaccount.google.com
2. Click "Security" in the left menu
3. Under "How you sign in to Google", make sure "2-Step Verification" is ON
   (if not, turn it on first — it's required for App Passwords)
4. Search for "App passwords" in the search bar at the top, or go to:
   myaccount.google.com/apppasswords
5. Click "Create" → give it a name like "Upload Scheduler" → click Create
6. Google will show you a 16-character password (like: abcd efgh ijkl mnop)
7. COPY IT NOW — you won't see it again
8. Save in your notes:
   - GMAIL_USER = your full Gmail address (e.g. yourname@gmail.com)
   - GMAIL_APP_PASSWORD = the 16-character password (no spaces)

---

## STEP 3 — GitHub (upload your code)

1. Go to github.com → sign up / log in
2. Click "+" → New repository
3. Name: upload-scheduler → Private → Create repository
4. Click "uploading an existing file"
5. Unzip the upload-scheduler-email.zip file you downloaded
6. Select ALL files inside the unzipped folder → drag them into GitHub
7. Click "Commit changes"

---

## STEP 4 — Vercel (host your app + run daily emails)

1. Go to vercel.com → Sign up with GitHub
2. Click "Add New…" → Project → Import your upload-scheduler repo
3. Framework: Next.js (auto-detected — leave as is)
4. Click "Environment Variables" and add ALL 8 of these:

   NEXT_PUBLIC_SUPABASE_URL       → your Supabase Project URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY  → your Supabase anon key
   SUPABASE_SERVICE_ROLE_KEY      → your Supabase service_role key
   GMAIL_USER                     → your Gmail address
   GMAIL_APP_PASSWORD             → your 16-character app password
   CRON_SECRET                    → make up any random string (e.g. myschedulekey99)
   TIMEZONE                       → your timezone (see list below)

   Timezones:
   - South Africa:  Africa/Johannesburg
   - UK:            Europe/London
   - UAE:           Asia/Dubai
   - USA (NY):      America/New_York
   - Australia:     Australia/Sydney

5. Click Deploy → wait ~1 minute → your app is live!

---

## STEP 5 — Test it works

1. Open your live app URL
2. Click ⚙️ Settings → add yourself as a staff member (with your email)
3. Add a test post for tomorrow's date on the calendar
4. Click the "📧 Email Automation" tab
5. Click "Send Tomorrow's Email Now"
6. Check your inbox — you should receive a nicely formatted email within seconds!

---

## STEP 6 — Set up for real use

1. ⚙️ Settings → add all your clients with names and colours
2. ⚙️ Settings → add all staff email addresses
3. Start adding posts to the calendar

The app will automatically email all staff at 6pm every day with the
next day's schedule. No action needed from you.

---

## Changing the send time

The email sends at 6pm UTC by default. To change it:
- Open vercel.json in your GitHub repo
- Change "0 18 * * *" to your preferred time (UTC)
- Common adjustments:
  * South Africa (UTC+2): want 6pm local → use "0 16 * * *"
  * UAE (UTC+4): want 6pm local → use "0 14 * * *"
  * UK (UTC+0/+1): want 6pm local → use "0 18 * * *" or "0 17 * * *" in summer

---

## Troubleshooting

PROBLEM: Email not received
- Check your spam/junk folder
- Make sure GMAIL_APP_PASSWORD has no spaces
- Make sure 2-Step Verification is enabled on your Google account
- Try generating a new App Password

PROBLEM: App shows error or blank screen
- Check all environment variables are correct in Vercel
- Go to Vercel → your project → Settings → Environment Variables and double-check

PROBLEM: Posts not saving
- Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correct
- Make sure you ran the SQL successfully in Step 1
