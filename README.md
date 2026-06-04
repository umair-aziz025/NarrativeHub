# NarrativeHub

<p align="center">
  <b>Collaborative storytelling rooms, living story chains, and community-first writing tools.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=111111" alt="React TypeScript">
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node Express">
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/AI-OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License">
</p>

NarrativeHub is an open-source collaborative storytelling platform where writers create rooms, continue shared story chains, manage community roles, and build interactive writing spaces together. It combines a React/Vite frontend, an Express API, PostgreSQL with Drizzle ORM, JWT-based authentication, WebSocket room updates, and optional OpenAI-assisted writing features.

> Built for writing communities, classroom storytelling, roleplay groups, creative workshops, and open-source experiments in collaborative narrative design.

## ✨ What This Project Does

- Creates public and private storytelling rooms with prompts, themes, and room codes.
- Lets contributors continue story chains in sequence while preserving narrative flow.
- Supports role-based room access for creators, managers, contributors, viewers, moderators, and admins.
- Provides community features including profiles, hearts, comments, featured stories, and XP-style progression.
- Includes moderation workflows for approvals, suspensions, reports, and admin review.
- Uses WebSockets for live room activity and story updates.
- Adds optional AI assistance when `OPENAI_API_KEY` is configured.
- Keeps secrets out of source control through environment variables and `.env.example` placeholders.

## 🏗️ Architecture Overview

```text
┌────────────────────────────┐
│ React Frontend             │
│ TypeScript + Vite          │
│ Wouter + TanStack Query    │
└─────────────┬──────────────┘
              │ REST / JSON
              ▼
┌────────────────────────────┐        ┌────────────────────────────┐
│ Express Backend            │◄──────►│ PostgreSQL Database        │
│ Node.js API + Auth Routes  │        │ Drizzle ORM Schema         │
└──────┬──────────────┬──────┘        └────────────────────────────┘
       │              │
       │ WebSocket    │ Optional AI / media workflows
       ▼              ▼
┌──────────────────┐  ┌────────────────────────────┐
│ Room Live Sync   │  │ OpenAI Services            │
│ /ws room channel │  │ Story continuation + audio │
└──────────────────┘  └────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│ Storytelling Domain                              │
│ Users, Rooms, Room Members, Stories, Comments,   │
│ Hearts, Themes, Picks, Suspensions, Requests     │
└──────────────────────────────────────────────────┘
```

The frontend is the writing workspace: landing, auth, rooms, room interior, community, profile, moderation, help, and policy pages. It talks to the Express API through typed request helpers and keeps server state fresh with TanStack Query.

The backend owns authentication, authorization, room membership, story-chain ordering, comments, hearts, moderation actions, contributor requests, exports, WebSocket room events, and optional OpenAI features. Drizzle maps the application domain into PostgreSQL tables.

## 🔄 Application Flow

```text
Visitor
  │
  ▼
Landing / Community Preview
  │
  ├──► Register / Login ──► JWT Token ──► Approved User Session
  │
  ▼
Explore Public Rooms or Join by Code
  │
  ├──► Create Room ──► Creator Membership ──► Room Settings
  │
  └──► Join Room ────► Viewer / Contributor / Manager Role
  │
  ▼
Room Interior
  │
  ├──► Add Story Segment ──► Chain ID + Sequence ──► Room Story Feed
  │
  ├──► Heart / Comment ────► Engagement Counts ───► Community Stats
  │
  ├──► Request Contributor ─► Manager Review ─────► Role Update
  │
  └──► WebSocket Event ─────► Live Room Refresh
  │
  ▼
Export, Feature, Moderate, or Continue with AI Assist
```

## 🧩 Domain Model

```text
Users
  ├── own Rooms
  ├── join Room Members
  ├── write Stories
  ├── create Comments
  └── give Hearts

Rooms
  ├── contain Story Chains
  ├── manage Members and Roles
  ├── accept Contributor Requests
  └── enforce Blocks / Suspensions

Stories
  ├── belong to a Chain and optional Room
  ├── keep ordered Sequence numbers
  ├── collect Hearts and Comments
  └── can appear in Community Picks
```

## 🧰 Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, shadcn-style components |
| State & Forms | TanStack Query, React Hook Form, Zod |
| Backend | Node.js, Express, TypeScript, Multer, WebSocket |
| Database | PostgreSQL, Neon serverless driver, Drizzle ORM, Drizzle Kit |
| Auth | Local accounts, bcrypt password hashing, JWT access tokens |
| AI | OpenAI SDK, optional writing assistance |
| Tooling | ESBuild, TSX, PostCSS, Tailwind, TypeScript |

## 🧱 Core Modules

| Module | Purpose |
| --- | --- |
| Landing & Home | Introduces the writing community and routes users into story spaces. |
| Authentication | Handles registration, login, profile updates, password hashing, and JWT auth. |
| Rooms | Creates and manages collaborative story rooms, privacy settings, codes, and membership. |
| Story Chains | Stores ordered contributions and lets writers continue shared narratives. |
| Community | Shows writers, activity, hearts, comments, featured stories, and profile details. |
| Moderation | Supports admin setup, user approvals, role changes, suspensions, and reports. |
| AI Assist | Offers optional prompt and writing support through OpenAI when configured. |

## ✅ Requirements

- Node.js 18+
- npm
- PostgreSQL database, such as Neon or a local Postgres instance
- Optional: OpenAI API key for AI-assisted writing

## 🔐 Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Required values:

```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="replace-with-a-long-random-secret"
```

Optional values:

```env
OPENAI_API_KEY=""
NODE_ENV="development"
PORT=5000
```

Never commit real credentials. `.env` files are ignored by Git.

## 🚀 Quick Start

```bash
git clone https://github.com/umair-aziz025/NarrativeHub.git
cd NarrativeHub
npm install
cp .env.example .env
npm run db:push
npm run dev
```

Open the app at:

```text
http://localhost:5000
```

The Express server hosts the API and, in development, serves the Vite frontend through the same port.

## 🛠️ Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Express server with Vite development middleware. |
| `npm run build` | Build the React client and bundle the server into `dist/`. |
| `npm start` | Run the production server from `dist/`. |
| `npm run check` | Run TypeScript checks. |
| `npm run db:push` | Push Drizzle schema changes to the configured database. |

## 🛡️ Security Notes

- `JWT_SECRET` is required at runtime and must be a long random value.
- `DATABASE_URL`, `OPENAI_API_KEY`, and other secrets must stay in local `.env` files or deployment secret stores.
- Passwords are hashed with bcrypt before storage.
- AI features are optional; the app starts without OpenAI support when no API key is provided.
- Report vulnerabilities privately through the process in `SECURITY.md`.

## 🤝 Responsible Use

NarrativeHub is designed for constructive writing communities. Operators should moderate harmful content, protect user privacy, and configure access rules that match their audience. If you deploy a public instance, review the built-in privacy, report-content, and community-guidelines pages before launch.

## 🌱 Contributing

Contributions are welcome. Please read `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` before opening a pull request.

## 📄 License

NarrativeHub is released under the MIT License. See `LICENSE.txt` for details.

## 👨‍💻 Author

Developed and maintained by [Umair Aziz](https://github.com/umair-aziz025).
