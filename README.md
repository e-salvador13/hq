# HQ

Personal command center. Tasks, projects, ideas, crons — all in one place.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

## Features

### ✅ Tasks
- Quick add with text or voice input
- Tap to complete, swipe to delete
- Completed tasks tracked separately
- Persisted to localStorage

### 📁 Projects
- Live sync with GitHub API
- Shows recently active repos first
- Displays language, live URL badge, last updated
- Links directly to repo or deployed site

### 💡 Ideas
- Capture project ideas to research later
- Voice input supported
- Research workflow (coming soon)

### ⏰ Crons
- View scheduled jobs from Clawdbot
- Shows next run time, enabled status
- Fallback display when not connected locally

### 📝 Notes
- Quick capture for thoughts
- Auto-tagging (todo, bug, idea, learn)
- Voice input supported

## Stack

- **Next.js 16** with App Router
- **TypeScript**
- **Tailwind CSS 4**
- **Framer Motion** for animations
- **Web Speech API** for voice input

## Design

Inspired by Perplexity and Apple Health — dark, minimal, glassy cards with subtle depth.

- Pure black background
- Glass morphism cards
- Single accent color
- Elegant typography
- Smooth micro-animations

## Getting Started

```bash
# Install
npm install

# Dev
npm run dev

# Build
npm run build
```

## Deployment

Deployed on Vercel: [hq-nu.vercel.app](https://hq-nu.vercel.app)

## Local Features

When running locally with Clawdbot, the Crons tab shows live job status. On Vercel, it displays sample data.

## Storage

All data (tasks, notes, ideas) persists to browser localStorage. No backend required.

---

Built with [Clawdbot](https://github.com/clawdbot/clawdbot)
