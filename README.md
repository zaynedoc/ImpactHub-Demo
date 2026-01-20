# ImpactHub

A modern fitness tracking web application built with Next.js 14, Supabase, and Stripe. Track workouts, monitor progress, and generate AI-powered workout programs.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase)

## Features

- **Workout Logging** – Create, edit, and track workouts with exercises, sets, and reps
- **Progress Tracking** – Visualize strength gains and personal records over time
- **AI Plan Generator** – Generate personalized workout programs using OpenAI (Pro feature)
- **Calendar View** – Schedule and view workouts on an interactive calendar
- **Subscription System** – Free and Pro tiers with Stripe integration
- **Secure Authentication** – Email/password auth with rate limiting via Supabase Auth
- **Demo Mode (WIP)** – Test all features without API keys using built-in sample data

## 🎮 Demo Mode (No API Keys Required)

ImpactHub includes a fully functional demo mode that allows testers to explore all features without configuring Supabase, Stripe, or OpenAI API keys

### How to Access Demo Mode

1. **Run the app** without any environment variables configured
2. **Navigate to the login page** at `/auth/login`
3. **Choose one of two options:**
   - Click **"Continue as Demo User"** button
   - Use guest credentials: `guest@guest.com` / `Password123`

### What's Included in Demo Mode

| Feature | Demo Behavior |
|---------|--------------|
| **Dashboard** | Shows sample workout stats, PRs, and streak data |
| **Workouts** | Pre-loaded with 3 completed workouts + 1 planned workout |
| **Create Workout** | Save new workouts to the demo session (in-memory) |
| **Programs** | Includes a full 6-day Push/Pull/Legs program + Starting Strength |
| **AI Generator** | Disabled with message explaining API key requirement |
| **Calendar** | Displays demo workouts on their respective dates |
| **Progress** | Fully unlocked with sample PR history and volume analytics |
| **Settings** | View demo user profile and preferences |

### Demo Data Details

- **Workouts**: 4 sample workouts spanning the past week
- **Exercises**: 26 exercises in the autocomplete library
- **Personal Records**: 5 PRs for major compound lifts
- **Programs**: 
  - Push Pull Legs (6-day split, 8 weeks, intermediate)
  - Starting Strength (3-day full body, 12 weeks, beginner)

### Important Notes

- **Data is not persisted** – All changes are stored in memory and reset on page refresh
- **No real authentication** – Demo mode bypasses Supabase Auth entirely
- **AI features disabled** – Requires `OPENAI_API_KEY` to generate workout plans
- **Payments not processed** – Stripe integration requires API keys

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Stripe |
| AI | OpenAI GPT-4o-mini |

## Getting Started

### Quick Start (Demo Mode)

Want to try ImpactHub without setting up any services? Run it in demo mode:

```bash
git clone https://github.com/zaynedoc/ImpactHub-Demo.git
cd ImpactHub-Demo/WebApp_ImpactHub
npm install
npm run dev
```

Then visit [http://localhost:3000/auth/login](http://localhost:3000/auth/login) and click **"Continue as Demo User"**.

---

### Full Setup (With Backend Services)

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account (free tier works)
- Stripe account (test mode)
- OpenAI API key (optional, for AI features)

### 1. Clone the Repository

```bash
git clone https://github.com/zaynedoc/ImpactHub-Demo.git
cd WebApp_ImpactHub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings ? API** and copy:
   - Project URL ? `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key ? `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key ? `SUPABASE_SERVICE_ROLE_KEY`
3. Run the database migrations:
   ```bash
   # Using Supabase CLI (recommended)
   npx supabase db push
   
   # Or manually run SQL files in order from supabase/migrations/
   ```

### 4. Set Up Stripe (Test Mode)

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Enable **Test Mode** (toggle in dashboard)
3. Go to **Developers ? API keys** and copy:
   - Publishable key ? `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key ? `STRIPE_SECRET_KEY`
4. Create a product and price:
   - Go to **Products ? Add product**
   - Name: "Pro Subscription", Price: $4.99/month (recurring)
   - Copy the Price ID ? `STRIPE_PRO_PRICE_ID`
5. Set up webhook (for local development):
   ```bash
   # Install Stripe CLI: https://stripe.com/docs/stripe-cli
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```
   Copy the webhook signing secret ? `STRIPE_WEBHOOK_SECRET`

### 5. Set Up OpenAI (Optional)

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env.local` ? `OPENAI_API_KEY`

### 6. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in all required values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# OpenAI (optional)
OPENAI_API_KEY=sk-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
WebApp_ImpactHub/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public pages (landing, features, pricing)
│   ├── api/               # API routes
│   ├── auth/              # Auth pages (login, signup, etc.)
│   └── dashboard/         # Protected dashboard pages
├── components/            # React components
│   ├── ai/               # AI-related components
│   ├── billing/          # Subscription/payment components
│   ├── effects/          # Visual effect components
│   ├── layout/           # Layout components (Navbar, Sidebar)
│   ├── programs/         # Workout program components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions and configurations
│   ├── demo/             # Demo mode store and sample data
│   └── supabase/         # Supabase client setup
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── supabase/             # Database migrations and scripts
    └── migrations/       # SQL migration files
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Testing Stripe Payments

Use these test card numbers in Stripe test mode:

| Card | Number |
|------|--------|
| Success | `4242 4242 4242 4242` |
| Declined | `4000 0000 0000 0002` |
| Requires Auth | `4000 0025 0000 3155` |

Use any future expiry date and any 3-digit CVC.

## License

MIT

---

Built by [zaynedoc](https://github.com/zaynedoc)