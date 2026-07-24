# AWS Event Online Voting Application

A modern, responsive, real-time single-event voting web application built with **React**, **Vite**, **Tailwind CSS**, **Supabase** (PostgreSQL & Storage), and **Chart.js**.

---

## Features & Highlights

- **Role-Based Access**: Role selector landing page (`[ Admin ]` / `[ Voter ]`).
- **Secure Backend Authentication**: Admin credentials (`aws_team` / `AWS_TEAM_PASSWORD`) validated via Supabase RPC / server logic.
- **Dynamic Contestants Creation**: Unlimited contestant name entries with image file upload to Supabase Storage.
- **Single-Event Voting Session**: Easy control to mark voting sessions `ACTIVE` or `COMPLETED`.
- **Responsive Contestant Cards**: Modern grid layout, equal-sized candidate images, hover animations, scale effects, active glowing border, and check badge indicator.
- **Single Candidate Selection**: Card selection acts as vote choice; "Submit Vote" action enables dynamically.
- **Duplicate Vote Prevention**: Unique browser device UUID (`crypto.randomUUID()` stored in `localStorage`) matched against database constraints.
- **Real-Time Chart.js Analytics**: Interactive horizontal bar chart displaying total votes, candidate breakdown, vote percentages, and live auto-updates.
- **Dual-Mode Engine**: Connects to Supabase when `.env` keys are configured, with a smooth built-in local persistence driver for immediate out-of-the-box offline preview.

---

## Admin Credentials

- **Username**: `aws_team`
- **Password**: `AWS_TEAM_PASSWORD`

---

## Setup Instructions

### 1. Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure Environment Variables
cp .env.example .env

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 2. Supabase Integration Setup

1. Log into your [Supabase Dashboard](https://supabase.com).
2. Create a new project.
3. Open the **SQL Editor** in Supabase and paste the contents of `supabase_setup.sql`. Click **Run**.
4. Navigate to **Project Settings -> API** in your Supabase dashboard and copy:
   - `Project URL`
   - `anon / public API Key`
5. Update your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

---

### 3. Deploying to Vercel

1. Push your code repository to GitHub / GitLab.
2. Log into [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Set Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables in Vercel settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Deploy**.

---

## Folder Structure

```
src/
├── components/
│   ├── ContestantCard.jsx
│   ├── Navbar.jsx
│   ├── ProtectedRoute.jsx
│   ├── Loader.jsx
│   └── Toast.jsx
├── pages/
│   ├── Landing.jsx
│   ├── AdminLogin.jsx
│   ├── AdminDashboard.jsx
│   ├── CreateVoting.jsx
│   ├── Voting.jsx
│   └── Results.jsx
├── services/
│   ├── supabase.js
│   └── auth.js
├── hooks/
│   ├── useVotingSession.js
│   └── useVoterId.js
├── App.jsx
├── main.jsx
└── index.css
```
