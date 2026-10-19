# Employee Performance Predictor

A web application that predicts employee performance using a React + TypeScript frontend. The app uses Supabase for data/storage and is built with Vite. A live demo is available at:

https://employee-performance-0od7.bolt.host/

## Features

- Responsive React + TypeScript UI
- Supabase integration for authentication and data
- Fast local development with Vite
- Type checking with TypeScript
- Basic linting setup

## Live Demo

Try the live demo here:

https://employee-performance-0od7.bolt.host/

## Tech stack

- TypeScript
- React
- Vite
- Supabase
- Tailwind CSS (configured in project)

## Prerequisites

- Node.js (v18+ recommended)
- npm, yarn, or pnpm

## Quick start

1. Clone the repository

   git clone https://github.com/Sakshi-2006/Employee-Performance-Predictor.git
   cd Employee-Performance-Predictor

2. Install dependencies

   npm install
   # or
   # yarn
   # pnpm install

3. Environment variables

Create a `.env` file at the project root with your Supabase credentials. Example:

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key

Adjust the variable names if the project expects different keys.

4. Run the development server

   npm run dev

Open http://localhost:5173 (or the URL printed by Vite) in your browser.

## Available scripts

- `npm run dev` — start Vite dev server
- `npm run build` — build for production
- `npm run preview` — locally preview the production build
- `npm run lint` — run ESLint
- `npm run typecheck` — run TypeScript type checks

These scripts are defined in `package.json`.

## Deployment

Build the app with `npm run build` and deploy the produced `dist` folder to any static host (Netlify, Vercel, Surge, or the Bolt host used for the demo).

## Contributing

Contributions are welcome. Open an issue to discuss changes or submit a pull request with a clear description of the change.

## Reporting issues

If you find a bug or unexpected behaviour, please open an issue with steps to reproduce, expected vs actual behaviour, and any logs or screenshots that help.

## License

This repository does not include a license file. If you intend to use or distribute this project, add a license (for example, the MIT license) to clarify permissions.

---

README generated and updated by repository maintainer instructions.
