# GitForest

<div align="center">

![GitForest Logo](public/icon.svg)

**A modern, cross-platform Git version control client built with Electron, React, and TypeScript.**

[![Electron](https://img.shields.io/badge/Electron-33.x-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## ✨ Features

### 🎨 Modern Dark UI
- Sleek, VS Code-inspired dark theme with glassmorphism effects
- Smooth animations and micro-interactions
- Customizable, resizable panels

### 📂 Repository Management
- Open any local Git repository
- View repository info, current branch, and remote status
- Track ahead/behind commits with remote

### 🌿 Branch Operations
- View all local branches in sidebar
- Quick branch switching with one click
- Create new branches
- Visual indicator for current branch

### 📝 Staging & Commits
- View staged and unstaged files separately
- Stage/unstage individual files or all at once
- Write commit messages with real-time preview
- Quick commit with keyboard shortcuts

### 📊 Commit History
- Beautiful commit graph visualization
- View commit details: hash, author, date, message
- Branch and tag labels on commits
- **Click on any commit to see changed files**
- View diff for specific files in a commit

### 📄 Diff Viewer
- Syntax-highlighted diff viewer
- Color-coded additions (green) and deletions (red)
- Line numbers for easy reference
- Support for all file types

### 🔄 Remote Operations
- **Pull** - Fetch and merge remote changes
- **Push** - Push local commits to remote
- **Fetch** - Fetch remote changes without merging

### 📦 Stash Support
- Stash uncommitted changes
- Pop stashed changes back

### 🖱️ Resizable Panels
- Drag to resize sidebar width (200-500px)
- Drag to resize changes/history panel (250-600px)
- Diff viewer automatically fills remaining space

---

## 📸 Screenshots

<!-- Add your screenshots here -->
<div align="center">

*Main interface with repository opened*

| Feature | Description |
|---------|-------------|
| **Sidebar** | Branch navigation and repository info |
| **Changes Tab** | View and stage/unstage files |
| **History Tab** | Browse commit history with file changes |
| **Diff Viewer** | See code changes with syntax highlighting |

</div>

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Git** installed on your system

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/huypham85/GitForest.git
   cd GitForest
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Running the App

#### Development Mode (Browser)
```bash
npm run dev
```
Opens at `http://localhost:5173` - Note: Git features require Electron

#### Development Mode (Electron)
```bash
npm run dev:electron
```
Runs the full Electron app with hot-reload

#### Production Build
```bash
npm run start
```
Builds and runs the production Electron app

### Building for Distribution

#### macOS
```bash
npm run dist:mac
```
Creates DMG and ZIP in `release/` folder

#### Windows
```bash
npm run dist:win
```
Creates NSIS installer and portable EXE in `release/` folder

---

## 📁 Project Structure

```
GitForest/
├── electron/
│   ├── main.mjs          # Electron main process with Git IPC handlers
│   └── preload.cjs       # Preload script exposing Git API to renderer
├── src/
│   ├── App.tsx           # Main React application component
│   ├── App.css           # Component-specific styles
│   ├── index.css         # Global styles and design system
│   └── types/
│       └── git.ts        # TypeScript type definitions
├── public/
│   └── icon.svg          # Application icon
├── dist/                 # Built web assets (generated)
├── release/              # Packaged app (generated)
└── package.json          # Dependencies and scripts
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Electron** | Cross-platform desktop framework |
| **React 19** | UI components and state management |
| **TypeScript** | Type safety and developer experience |
| **Vite** | Fast development and bundling |
| **simple-git** | Git operations via Node.js |
| **Lucide React** | Beautiful icons |
| **electron-builder** | App packaging and distribution |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Enter` | Commit staged changes |
| Click on branch | Switch to branch |
| Click on file | View diff |
| Click on commit | View commit files and diff |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by [Sourcetree](https://www.sourcetreeapp.com/)
- Icons by [Lucide](https://lucide.dev/)
- Built with [Electron](https://www.electronjs.org/)

---

<div align="center">

**Made with ❤️ using Electron + React + TypeScript**

</div>
