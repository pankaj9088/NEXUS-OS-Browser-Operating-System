# NEXUS OS — Browser Operating System

<div align="center">

![NEXUS OS Banner](https://ai.google.dev/static/site-assets/images/share-ais-513315318.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-blue.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)

**A futuristic, full-stack browser-based desktop operating system featuring multi-window multitasking, virtual file system, integrated terminal, AI copilot, rich productivity suite, and a cyberpunk aesthetic.**

[Live Local Server](http://localhost:3000) • [Getting Started](#-getting-started) • [Applications](#-built-in-applications) • [Architecture](#-architecture) • [API Reference](#-api-endpoints)

</div>

---

## 🌟 Highlights & Features

- 🖥️ **Full Window Management System**: Draggable, resizable, minimizable, and maximizable windows with z-index stacking and aero snap support.
- 🚀 **Spotlight Global Search**: Quick app launcher and system navigation via `Ctrl + K` or `Alt + Space`.
- 🤖 **Nexus AI Copilot**: Conversational AI assistant powered by Google Gemini (with built-in local heuristic simulation when no API key is provided).
- 📁 **Virtual File System**: Sandboxed file uploads, folder creation, file renaming, download links, and metadata tracking.
- 💻 **Interactive Virtual Terminal**: Shell environment supporting commands like `help`, `ls`, `cat`, `open`, `clear`, and more.
- 🔐 **Dual Auth & Isolation**: JWT authentication with httpOnly cookies, user session isolation, and frictionless Guest Mode.
- 🎨 **Deep Customization**: High-resolution wallpapers, dark/light modes, accent color palettes, customizable dock position, and glassmorphic blur levels.
- 💾 **Dual-Mode Persistence**: Automatically persists to local disk via `.nexus_data/` JSON storage, with seamless MongoDB support if `MONGODB_URI` is configured.

---

## 📦 Built-in Applications

| Icon | Application | Description |
|:---:|---|---|
| 🤖 | **AI Copilot** | Conversational assistant for coding help, system commands, and queries (Gemini 3.8 Flash). |
| 💻 | **Terminal** | Cyber-styled command prompt with virtual filesystem interaction. |
| 📁 | **Files** | Full-fledged file explorer with folder hierarchy, file uploads, and downloads. |
| 📝 | **Code Editor** | Clean, syntax-styled development text editor for viewing and editing files. |
| 🌐 | **Browser** | In-OS web navigation portal with bookmarks and navigation controls. |
| 🗒️ | **Notes** | Fast, distraction-free markdown note-taking with real-time autosave. |
| 📅 | **Calendar** | Event manager with date selection, category tagging, and agenda view. |
| 📊 | **System Monitor** | Live CPU gauge, memory utilization, process manager, and system telemetry. |
| 🎵 | **Music Player** | Ambient synthwave audio player with interactive playback controls. |
| 🕹️ | **Arcade** | Retro sci-fi *Neon Breakout* canvas arcade game. |
| 🧮 | **Calculator** | Quick desktop calculator for rapid mathematical operations. |
| ⚙️ | **Settings** | Personalization center for themes, wallpapers, dock layout, and audio effects. |

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Alt + Space` or `Ctrl + K` | Open Spotlight Search Panel |
| `Alt + T` | Open Terminal |
| `Escape` | Close active overlays, modals, and start menu |

---

## 🏗️ Architecture

```
nexus-os/
├── server.ts                 # Express entrypoint + Vite middleware integration
├── server/
│   └── src/
│       ├── config/           # Environment variables, database, and Gemini config
│       ├── middleware/       # JWT auth, Multer upload, rate-limiting, error handling
│       ├── models/           # Mongoose schemas (User, Note, File, Event, Workspace)
│       ├── routes/           # REST API routes (/api/ai, /api/auth, /api/files, etc.)
│       ├── services/         # Data services, Gemini API, and file storage
│       └── store/            # In-memory + disk JSON fallback store (.nexus_data/)
├── src/
│   ├── assets/               # High-res wallpapers and sound assets
│   ├── components/
│   │   ├── apps/             # 12+ built-in desktop applications
│   │   ├── desktop/          # Desktop background, desktop icons, context menu
│   │   ├── lockscreen/       # Lock screen & user authentication UI
│   │   ├── notifications/    # Toast notification container & notification center
│   │   ├── taskbar/          # Taskbar, Start Menu, System Tray, Search Flyout
│   │   └── window/           # Window frame, title bar, controls, and window manager
│   ├── store/                # Modular Zustand stores (windows, auth, settings, etc.)
│   └── App.tsx               # Main OS layout container
└── test_suite.mjs            # Comprehensive automated integration test suite
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/nexus-os.git
cd nexus-os

# Install dependencies (use --legacy-peer-deps for Vite/esbuild peer resolution)
npm install --legacy-peer-deps
```

### 2. Configure Environment (Optional)

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Available environment variables:

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port for the combined Express & Vite server | `3000` |
| `NODE_ENV` | Environment mode (`development` or `production`) | `development` |
| `GEMINI_API_KEY` | Google Gemini API key for live AI Copilot responses | *(Optional, local simulation used if omitted)* |
| `MONGODB_URI` | MongoDB connection URI | *(Optional, in-memory `.nexus_data/` store used if omitted)* |
| `JWT_SECRET` | Secret key used for signing JWT tokens | Default fallback provided |

### 3. Run the Development Server

```bash
npm run dev
```

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Testing & Verification

Run the automated backend audit and regression test suite:

```bash
npm test
```

This verifies:
- User registration, login, and JWT token issuance
- File upload restrictions (blocking `.exe`, `.sh`, and payload limits)
- Multi-tenant file isolation and authorization
- Workspace and personalization persistence
- Calendar, Notes, and AI conversation endpoints

To run TypeScript verification:

```bash
npm run lint
```

To build for production:

```bash
npm run build
npm start
```

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health check and system timestamp |
| `/api/auth/register` | `POST` | Register a new user |
| `/api/auth/login` | `POST` | Login user and issue JWT cookie/token |
| `/api/auth/me` | `GET` | Retrieve current authenticated user profile |
| `/api/files` | `GET`, `POST` | List and upload virtual files |
| `/api/files/:id` | `GET`, `PATCH`, `DELETE` | Download, rename/move, or delete a file |
| `/api/notes` | `GET`, `POST` | List and create notes |
| `/api/notes/:id` | `GET`, `PUT`, `DELETE` | Retrieve, update, or delete a note |
| `/api/events` | `GET`, `POST` | List and create calendar events |
| `/api/events/:id` | `PATCH`, `DELETE` | Update or remove a calendar event |
| `/api/workspace` | `GET`, `PATCH` | Read or update desktop customizations |
| `/api/ai/chat` | `POST` | Send chat prompt to AI Copilot (supports SSE stream) |
| `/api/ai/conversations` | `GET`, `POST` | Manage AI conversation threads |

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
