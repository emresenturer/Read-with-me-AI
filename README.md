# Read-with-me-AI

A voice-enabled AI reading tutor for kids. An animated teacher listens, speaks, and guides children through reading and vocabulary lessons laid out on a level map; completing a lesson unlocks the next level.

**Live:** [emresenturer.github.io/Read-with-me-AI](https://emresenturer.github.io/Read-with-me-AI/) (bring your own free Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey); it stays in your browser). Allow microphone access for the voice lessons.

## What it does

- **Level map** — lessons organized as unlockable levels
- **Interactive lessons** — read-along experience built for young readers
- **Progression** — finishing a lesson unlocks the next one
- **AI-assisted** — reading support powered by the Gemini API

## Run locally

Prerequisites: Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Optionally set your Gemini API key in `.env.local` (otherwise the app asks for it):
   ```
   GEMINI_API_KEY=your-key-here
   ```
3. Start the app:
   ```bash
   npm run dev
   ```

## Deploy

Every push to `main` builds the app and publishes `dist/` to the `gh-pages` branch (`.github/workflows/pages.yml`).

## Stack

React, TypeScript, Vite, Tailwind CSS, Gemini API. By [Emre Senturer](https://github.com/emresenturer).
