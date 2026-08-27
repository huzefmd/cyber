# 🛡️ Cyber

A modern, full-stack web application built with **TanStack Start, React, TypeScript, Tailwind CSS, Vite, and Supabase**.

Cyber is structured as a scalable web application with a server-enabled React architecture, reusable components, database integration, and a modern responsive UI.

---

## ✨ Overview

**Cyber** is a modern web application designed with a focus on a clean user experience, scalable architecture, and secure backend integration.

The project uses **TanStack Start** to combine the React frontend with server-side capabilities, while **Supabase** provides backend services and database functionality.

The application is written in **TypeScript** and uses **Tailwind CSS** for responsive and maintainable styling.

---

## 🚀 Features

The project architecture supports the following capabilities:

* 🖥️ Modern responsive web interface
* ⚛️ React-based component architecture
* 🔐 Supabase backend integration
* 🗄️ Database integration through Supabase
* 🌐 Server-side functionality using TanStack Start
* 📦 TypeScript for type-safe development
* 🎨 Tailwind CSS styling
* ⚡ Vite-powered development environment
* 🧩 Reusable UI components
* 📱 Responsive design for desktop, tablet, and mobile
* 🔧 Environment-based configuration
* 🛡️ Server-side handling for backend functionality

> Additional application-specific features can be added here as the Cyber platform grows.

---

# 🛠️ Technology Stack

| Technology         | Purpose                                |
| ------------------ | -------------------------------------- |
| **React**          | Frontend user interface                |
| **TanStack Start** | Full-stack React application framework |
| **TypeScript**     | Type-safe application development      |
| **Tailwind CSS**   | UI styling and responsive design       |
| **Vite**           | Development server and build tooling   |
| **Supabase**       | Database and backend services          |
| **Bun**            | Package manager/runtime support        |
| **npm**            | Alternative package manager            |

---

# 📁 Project Structure

```text
cyber/
│
├── .tanstack/
│   └──                    # TanStack generated files
│
├── node_modules/
│   └──                    # Installed dependencies
│
├── public/
│   └──                    # Static assets
│
├── src/
│   ├── components/
│   │   └──               # Reusable React components
│   │
│   ├── routes/
│   │   └──               # Application routes
│   │
│   ├── lib/
│   │   └──               # Shared utilities and application logic
│   │
│   └── ...               # Application source code
│
├── supabase/
│   ├── migrations/
│   │   └──               # Database migrations
│   └── ...               # Supabase configuration
│
├── .env
├── .gitignore
├── .prettierignore
├── .prettierrc
├── AGENTS.md
├── bun.lock
├── bunfig.toml
├── components.json
├── eslint.config.js
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# ⚙️ Requirements

Before running Cyber locally, make sure you have the following installed:

### Node.js

Node.js is required for running the application and npm commands.

Check your installation:

```bash
node --version
```

Check npm:

```bash
npm --version
```

### Bun

Bun can also be used if it is configured for the project.

Check Bun:

```bash
bun --version
```

If you prefer npm, you can use npm throughout the project.

---

# 📥 Installation

## 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
```

Move into the project directory:

```bash
cd cyber
```

---

## 2. Install dependencies

### Using npm

```bash
npm install
```

### Or using Bun

```bash
bun install
```

---

# 🔐 Environment Variables

Cyber uses environment variables for configuration and backend connectivity.

Create a local environment file:

```text
.env
```

or, if the application configuration expects it:

```text
.env.local
```

Add the required Supabase configuration.

Example:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

If server-side Supabase functionality requires additional variables, configure them in the environment used by the server.

### Important

Never commit sensitive credentials to GitHub.

Do not expose:

```text
SUPABASE_SERVICE_ROLE_KEY
```

or other private API keys in client-side code.

Add environment files to `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

---

# 🗄️ Supabase Setup

Cyber uses **Supabase** for backend/database functionality.

Create or use a Supabase project and configure the required environment variables.

The project contains a:

```text
supabase/
```

directory that can contain database migrations and Supabase-related configuration.

After configuring Supabase, make sure:

1. The Supabase project is active.
2. Required database tables exist.
3. Required migrations have been applied.
4. Row Level Security is configured where required.
5. Environment variables are correctly configured.

---

# ▶️ Running the Application

Start the development server with npm:

```bash
npm run dev
```

Or with Bun:

```bash
bun run dev
```

After the development server starts, open the local URL displayed in the terminal.

A typical Vite development server may run on:

```text
http://localhost:3000
```

or another port configured by the project.

Always use the URL printed by the terminal.

---

# 🏗️ Building for Production

Create a production build:

```bash
npm run build
```

or:

```bash
bun run build
```

This creates the optimized production application.

---

# 🚀 Production

After building the application, run the production server using the command configured in `package.json`.

For example:

```bash
npm run start
```

or:

```bash
bun run start
```

> The exact production command depends on the scripts defined in `package.json`.

---

# 🧪 Development Workflow

A typical development workflow is:

```text
        ┌─────────────────┐
        │   Developer     │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │   React / UI    │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ TanStack Start  │
        └────────┬────────┘
                 │
          ┌──────┴──────┐
          ▼             ▼
   ┌────────────┐ ┌─────────────┐
   │   Server   │ │   Supabase  │
   │ Functions  │ │   Database  │
   └────────────┘ └─────────────┘
```

Recommended workflow:

```text
1. Pull the latest code
2. Install dependencies
3. Configure environment variables
4. Start the development server
5. Develop and test locally
6. Run linting/type checks
7. Create a production build
8. Deploy
```

---

# 🧹 Code Quality

The project includes ESLint and Prettier configuration.

Run the available lint command:

```bash
npm run lint
```

Format the project according to the configured Prettier rules:

```bash
npx prettier --write .
```

If the project uses Bun:

```bash
bunx prettier --write .
```

---

# 🔄 Git Workflow

Create a new feature branch:

```bash
git checkout -b feature/your-feature
```

Check modified files:

```bash
git status
```

Stage changes:

```bash
git add .
```

Commit:

```bash
git commit -m "Add new feature"
```

Push the branch:

```bash
git push origin feature/your-feature
```

---

# 🔒 Security

Security is an important part of the Cyber project.

## Environment Variables

Sensitive credentials must remain outside the source code.

Never hard-code:

* API keys
* Database passwords
* Service-role keys
* Authentication secrets
* Private tokens

## Supabase Security

Supabase database tables should use **Row Level Security (RLS)** where appropriate.

Policies should be configured according to the application's authorization requirements.

## Server-Side Operations

Sensitive operations should be handled server-side rather than exposing private credentials to the browser.

---

# 📱 Responsive Design

Cyber is designed to support different screen sizes.

The interface should be tested on:

* Desktop
* Laptop
* Tablet
* Mobile

Tailwind CSS is used to implement responsive layouts and reusable styling patterns.

---

# 🧩 Architecture

The application follows a separation between:

### UI Layer

React components responsible for:

* Rendering
* User interaction
* Navigation
* Forms
* Responsive layouts

### Application Layer

Shared utilities and application logic inside `src/`.

### Server Layer

TanStack Start server-side functionality for operations that should not execute directly in the browser.

### Database Layer

Supabase provides:

* Database services
* Backend functionality
* Authentication where configured
* Row Level Security
* Data persistence

---

# 🌐 Deployment

Cyber can be deployed to a hosting platform that supports the application's TanStack Start server/runtime requirements.

Before deployment:

### 1. Build the application

```bash
npm run build
```

### 2. Configure environment variables

Set the production values for:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

and any additional server-side environment variables required by the application.

### 3. Deploy

Deploy the generated application using the hosting provider's recommended TanStack Start configuration.

---

# 🐛 Troubleshooting

## Dependencies are not installing

Remove the existing dependencies and reinstall:

```bash
rm -rf node_modules
npm install
```

On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

---

## Supabase connection is failing

Check:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Make sure:

* The URL is correct.
* The key is correct.
* The Supabase project is active.
* The environment file is in the project root.
* The development server has been restarted after changing environment variables.

---

## Environment variables are not updating

Restart the development server after changing `.env` or `.env.local`.

```bash
npm run dev
```

Environment variables are generally loaded when the development server starts.

---

## Production build fails

Run:

```bash
npm run build
```

and inspect the first error reported by the build process.

Also check:

```bash
npm run lint
```

and:

```bash
npx tsc --noEmit
```

if TypeScript checking is configured independently.

---

# 📋 Useful Commands

| Command            | Description                           |
| ------------------ | ------------------------------------- |
| `npm install`      | Install dependencies                  |
| `npm run dev`      | Start development server              |
| `npm run build`    | Create production build               |
| `npm run start`    | Start production server if configured |
| `npm run lint`     | Run ESLint if configured              |
| `npx tsc --noEmit` | Check TypeScript                      |
| `git status`       | Check Git changes                     |
| `git add .`        | Stage changes                         |
| `git commit`       | Create Git commit                     |
| `git push`         | Push changes to remote repository     |

---

# 📌 Project Status

**Project:** Cyber

**Framework:** TanStack Start

**Frontend:** React + TypeScript

**Styling:** Tailwind CSS

**Build Tool:** Vite

**Backend:** Supabase

**Status:** Active Development

---

# 🤝 Contributing

Contributions and improvements are welcome.

Before submitting changes:

1. Create a feature branch.
2. Make your changes.
3. Test the application locally.
4. Check for TypeScript errors.
5. Run linting.
6. Create a clear commit.
7. Push your branch.
8. Submit a pull request.

---

# 📄 License

This project does not currently specify a license.

If Cyber is going to be publicly distributed or open sourced, add an appropriate license such as MIT, Apache 2.0, or another license suitable for the project.

---

# 👨‍💻 Cyber

**Cyber — Modern, scalable, and secure web application architecture.**

Built with:

**TanStack Start · React · TypeScript · Tailwind CSS · Vite · Supabase**
