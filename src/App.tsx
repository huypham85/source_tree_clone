import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GitBranch,
  FolderGit2,
  RefreshCw,
  Download,
  Upload,
  Plus,
  Settings,
  Search,
  File,
  FileText,
  FilePlus,
  FileMinus,
  FileEdit,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Folder,
  Clock,
  User,
  Archive,
  RotateCcw,
} from 'lucide-react';
import './App.css';
import type { GitStatus, GitLogEntry, RepoInfo, GitBranch as GitBranchType, ApiResponse } from './types/git';

// Mock API for development (when not running in Electron)
const isMockMode = typeof window.electronAPI === 'undefined';

const mockAPI = {
  selectFolder: async (): Promise<ApiResponse<string>> => ({ success: true, path: '/Users/demo/project', canceled: false }),
  openRepository: async (path: string): Promise<ApiResponse> => ({ success: true, path, error: undefined }),
  getRepoInfo: async () => ({
    success: true,
    data: {
      path: '/Users/demo/project',
      name: 'demo-project',
      branch: 'main',
      remotes: [{ name: 'origin', refs: { fetch: 'https://github.com/user/repo.git', push: 'https://github.com/user/repo.git' } }],
      status: {
        not_added: [],
        conflicted: [],
        created: ['new-file.ts'],
        deleted: [],
        modified: ['src/App.tsx', 'README.md'],
        renamed: [],
        staged: ['package.json'],
        files: [
          { path: 'new-file.ts', index: '?', working_dir: '?' },
          { path: 'src/App.tsx', index: ' ', working_dir: 'M' },
          { path: 'README.md', index: ' ', working_dir: 'M' },
          { path: 'package.json', index: 'M', working_dir: ' ' },
        ],
        ahead: 2,
        behind: 0,
        current: 'main',
        tracking: 'origin/main',
      },
    },
  }),
  getStatus: async () => ({
    success: true,
    data: {
      not_added: [],
      conflicted: [],
      created: ['new-file.ts'],
      deleted: [],
      modified: ['src/App.tsx', 'README.md'],
      renamed: [],
      staged: ['package.json'],
      files: [
        { path: 'new-file.ts', index: '?', working_dir: '?' },
        { path: 'src/App.tsx', index: ' ', working_dir: 'M' },
        { path: 'README.md', index: ' ', working_dir: 'M' },
        { path: 'package.json', index: 'M', working_dir: ' ' },
      ],
      ahead: 2,
      behind: 0,
      current: 'main',
      tracking: 'origin/main',
    },
  }),
  getBranches: async () => ({
    success: true,
    data: {
      current: 'main',
      all: ['main', 'develop', 'feature/new-ui', 'bugfix/login-issue'],
      branches: {
        main: { current: true, name: 'main', commit: 'abc123', label: 'main' },
        develop: { current: false, name: 'develop', commit: 'def456', label: 'develop' },
        'feature/new-ui': { current: false, name: 'feature/new-ui', commit: 'ghi789', label: 'feature/new-ui' },
        'bugfix/login-issue': { current: false, name: 'bugfix/login-issue', commit: 'jkl012', label: 'bugfix/login-issue' },
      },
    },
  }),
  getLog: async () => ({
    success: true,
    data: {
      all: [
        { hash: 'abc123def456', date: '2024-12-17T10:30:00', message: 'Add new feature component', refs: 'HEAD -> main, origin/main', body: '', author_name: 'John Doe', author_email: 'john@example.com' },
        { hash: 'def456ghi789', date: '2024-12-16T15:20:00', message: 'Fix login validation bug', refs: '', body: '', author_name: 'Jane Smith', author_email: 'jane@example.com' },
        { hash: 'ghi789jkl012', date: '2024-12-16T09:15:00', message: 'Update dependencies to latest versions', refs: '', body: '', author_name: 'John Doe', author_email: 'john@example.com' },
        { hash: 'jkl012mno345', date: '2024-12-15T14:45:00', message: 'Refactor authentication module', refs: '', body: '', author_name: 'Jane Smith', author_email: 'jane@example.com' },
        { hash: 'mno345pqr678', date: '2024-12-15T11:00:00', message: 'Initial commit', refs: '', body: '', author_name: 'John Doe', author_email: 'john@example.com' },
      ],
      latest: null,
      total: 5,
    },
  }),
  getDiff: async () => ({
    success: true,
    data: `diff --git a/src/App.tsx b/src/App.tsx
index abc123..def456 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -1,5 +1,10 @@
 import React from 'react';
+import { useState } from 'react';
 
 function App() {
+  const [count, setCount] = useState(0);
+
   return (
-    <div>Hello World</div>
+    <div>
+      <h1>Counter: {count}</h1>
+      <button onClick={() => setCount(c => c + 1)}>Increment</button>
+    </div>
   );
 }`,
  }),
  getCommitDetails: async (hash: string): Promise<ApiResponse> => ({
    success: true,
    data: {
      hash,
      diff: 'mock diff',
      files: [
        { status: 'M', path: 'src/App.tsx' },
        { status: 'A', path: 'new-file.ts' }
      ]
    }
  }),
  getFileDiffForCommit: async (): Promise<ApiResponse> => ({ success: true, data: 'mock diff for commit file' }),
  stage: async (): Promise<ApiResponse> => ({ success: true, error: undefined }),
  unstage: async (): Promise<ApiResponse> => ({ success: true, error: undefined }),
  commit: async (): Promise<ApiResponse> => ({ success: true, error: undefined }),
  pull: async (): Promise<ApiResponse> => ({ success: true, error: undefined }),
  push: async (): Promise<ApiResponse> => ({ success: true, error: undefined }),
  fetch: async (): Promise<ApiResponse> => ({ success: true, error: undefined }),
  checkout: async (): Promise<ApiResponse> => ({ success: true, error: undefined }),
  createBranch: async (): Promise<ApiResponse> => ({ success: true, error: undefined }),
  stash: async (): Promise<ApiResponse> => ({ success: true, error: undefined }),
  stashPop: async (): Promise<ApiResponse> => ({ success: true, error: undefined }),
};

const api = isMockMode ? mockAPI : window.electronAPI;

type TabType = 'changes' | 'history';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

function App() {
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [branches, setBranches] = useState<GitBranchType | null>(null);
  const [logs, setLogs] = useState<GitLogEntry[]>([]);
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [diff, setDiff] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('changes');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [branchesExpanded, setBranchesExpanded] = useState(true);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [commitFiles, setCommitFiles] = useState<Array<{ status: string, path: string }>>([]);

  // Panel widths for resizable panels
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [changesPanelWidth, setChangesPanelWidth] = useState(350);

  // Refs for resize handling
  const isResizingSidebar = useRef(false);
  const isResizingChanges = useRef(false);

  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const loadRepoData = useCallback(async () => {
    const [repoResult, branchResult, logResult, statusResult] = await Promise.all([
      api.getRepoInfo(),
      api.getBranches(),
      api.getLog(50),
      api.getStatus(),
    ]);

    if (repoResult.success && repoResult.data) {
      setRepoInfo(repoResult.data);
    }
    if (branchResult.success && branchResult.data) {
      setBranches(branchResult.data);
    }
    if (logResult.success && logResult.data) {
      setLogs(logResult.data.all);
    }
    if (statusResult.success && statusResult.data) {
      setStatus(statusResult.data);
    }
  }, []);

  const handleOpenRepository = useCallback(async () => {
    setLoading(true);
    try {
      const folderResult = await api.selectFolder();
      if (!folderResult.success || folderResult.canceled) {
        setLoading(false);
        return;
      }

      const path = folderResult.path || (folderResult as any).data;
      const openResult = await api.openRepository(path);

      if (openResult.success) {
        // Reset state from previous repository
        setSelectedCommit(null);
        setCommitFiles([]);
        setDiff('');
        setSelectedFile(null);

        await loadRepoData();
        showToast('Repository opened successfully!');
      } else {
        showToast(openResult.error || 'Failed to open repository', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to open repository', 'error');
    }
    setLoading(false);
  }, [loadRepoData, showToast]);

  const handleRefresh = useCallback(async () => {
    if (!repoInfo) return;
    setLoading(true);
    await loadRepoData();
    setLoading(false);
    showToast('Refreshed!');
  }, [repoInfo, loadRepoData, showToast]);

  const handlePull = useCallback(async () => {
    setLoading(true);
    const result = await api.pull();
    if (result.success) {
      await loadRepoData();
      showToast('Pull successful!');
    } else {
      showToast(result.error || 'Pull failed', 'error');
    }
    setLoading(false);
  }, [loadRepoData, showToast]);

  const handlePush = useCallback(async () => {
    setLoading(true);
    const result = await api.push();
    if (result.success) {
      await loadRepoData();
      showToast('Push successful!');
    } else {
      showToast(result.error || 'Push failed', 'error');
    }
    setLoading(false);
  }, [loadRepoData, showToast]);

  const handleFetch = useCallback(async () => {
    setLoading(true);
    const result = await api.fetch();
    if (result.success) {
      await loadRepoData();
      showToast('Fetch successful!');
    } else {
      showToast(result.error || 'Fetch failed', 'error');
    }
    setLoading(false);
  }, [loadRepoData, showToast]);

  const handleStage = useCallback(async (files: string | string[]) => {
    const result = await api.stage(files);
    if (result.success) {
      await loadRepoData();
      showToast('Files staged');
    } else {
      showToast(result.error || 'Failed to stage files', 'error');
    }
  }, [loadRepoData, showToast]);

  const handleUnstage = useCallback(async (files: string | string[]) => {
    const result = await api.unstage(files);
    if (result.success) {
      await loadRepoData();
      showToast('Files unstaged');
    } else {
      showToast(result.error || 'Failed to unstage files', 'error');
    }
  }, [loadRepoData, showToast]);

  const handleCommit = useCallback(async () => {
    if (!commitMessage.trim()) {
      showToast('Please enter a commit message', 'warning');
      return;
    }
    setLoading(true);
    const result = await api.commit(commitMessage);
    if (result.success) {
      setCommitMessage('');
      await loadRepoData();
      showToast('Commit successful!');
    } else {
      showToast(result.error || 'Commit failed', 'error');
    }
    setLoading(false);
  }, [commitMessage, loadRepoData, showToast]);

  const handleCheckout = useCallback(async (branch: string) => {
    setLoading(true);
    const result = await api.checkout(branch);
    if (result.success) {
      await loadRepoData();
      showToast(`Switched to ${branch}`);
    } else {
      showToast(result.error || 'Checkout failed', 'error');
    }
    setLoading(false);
  }, [loadRepoData, showToast]);

  const handleStash = useCallback(async () => {
    setLoading(true);
    const result = await api.stash();
    if (result.success) {
      await loadRepoData();
      showToast('Changes stashed!');
    } else {
      showToast(result.error || 'Stash failed', 'error');
    }
    setLoading(false);
  }, [loadRepoData, showToast]);

  const handleStashPop = useCallback(async () => {
    setLoading(true);
    const result = await api.stashPop();
    if (result.success) {
      await loadRepoData();
      showToast('Stash applied!');
    } else {
      showToast(result.error || 'Stash pop failed', 'error');
    }
    setLoading(false);
  }, [loadRepoData, showToast]);

  const handleFileSelect = useCallback(async (filePath: string) => {
    setSelectedFile(filePath);
    if (selectedCommit) {
      // Get diff for this file in the selected commit
      const result = await api.getFileDiffForCommit(selectedCommit, filePath);
      if (result.success && result.data) {
        setDiff(result.data);
      }
    } else {
      // Get working directory diff
      const result = await api.getDiff(filePath);
      if (result.success && result.data) {
        setDiff(result.data);
      }
    }
  }, [selectedCommit]);

  const handleCommitSelect = useCallback(async (commitHash: string) => {
    setSelectedCommit(commitHash);
    setSelectedFile(null);
    setDiff('');

    const result = await api.getCommitDetails(commitHash);
    if (result.success && result.data) {
      setCommitFiles(result.data.files || []);
      // Show full commit diff if available
      if (result.data.diff) {
        setDiff(result.data.diff);
      }
    }
  }, []);

  // Auto-refresh every 30 seconds when a repo is open
  useEffect(() => {
    if (repoInfo) {
      refreshIntervalRef.current = setInterval(() => {
        loadRepoData();
      }, 30000);
    }
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [repoInfo, loadRepoData]);

  // Load mock data in dev mode
  useEffect(() => {
    if (isMockMode) {
      loadRepoData();
    }
  }, [loadRepoData]);

  // Resize handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizingSidebar.current) {
      const newWidth = Math.max(200, Math.min(500, e.clientX));
      setSidebarWidth(newWidth);
    }
    if (isResizingChanges.current) {
      // Calculate width as distance from sidebar edge to mouse position
      const newWidth = Math.max(250, Math.min(600, e.clientX - sidebarWidth));
      setChangesPanelWidth(newWidth);
    }
  }, [sidebarWidth]);

  const handleMouseUp = useCallback(() => {
    isResizingSidebar.current = false;
    isResizingChanges.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const startResizeSidebar = useCallback(() => {
    isResizingSidebar.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const startResizeChanges = useCallback(() => {
    isResizingChanges.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const getFileIcon = (status: string) => {
    switch (status) {
      case 'A':
      case '?':
        return <FilePlus className="file-item__icon file-item__icon--added" />;
      case 'M':
        return <FileEdit className="file-item__icon file-item__icon--modified" />;
      case 'D':
        return <FileMinus className="file-item__icon file-item__icon--deleted" />;
      case 'R':
        return <FileText className="file-item__icon file-item__icon--renamed" />;
      default:
        return <File className="file-item__icon" />;
    }
  };

  const getStagedFiles = () => {
    if (!status) return [];
    return status.files.filter(f => f.index !== ' ' && f.index !== '?');
  };

  const getUnstagedFiles = () => {
    if (!status) return [];
    return status.files.filter(f => f.working_dir !== ' ');
  };

  const renderDiff = () => {
    if (!diff) {
      return (
        <div className="empty-state">
          <FileText className="empty-state__icon" />
          <h3 className="empty-state__title">No file selected</h3>
          <p className="empty-state__description">
            Select a file from the changes list to view its diff
          </p>
        </div>
      );
    }

    const lines = diff.split('\n');
    return (
      <div className="diff-viewer__content">
        {lines.map((line, index) => {
          let lineClass = 'diff-line';
          if (line.startsWith('+') && !line.startsWith('+++')) {
            lineClass += ' diff-line--added';
          } else if (line.startsWith('-') && !line.startsWith('---')) {
            lineClass += ' diff-line--removed';
          }
          return (
            <div key={index} className={lineClass}>
              <span className="diff-line__number">{index + 1}</span>
              <span className="diff-line__content">{line}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Empty state when no repo is open
  if (!repoInfo && !isMockMode) {
    return (
      <div className="app">
        <div className="title-bar">
          <span className="title-bar__title">GitFlow</span>
        </div>
        <div className="empty-state" style={{ flex: 1 }}>
          <FolderGit2 className="empty-state__icon" />
          <h2 className="empty-state__title">Welcome to GitFlow</h2>
          <p className="empty-state__description">
            A modern, beautiful Git client for managing your repositories.
            Open a repository to get started.
          </p>
          <button className="empty-state__btn" onClick={handleOpenRepository} disabled={loading}>
            {loading ? <div className="spinner" /> : <FolderGit2 size={18} />}
            Open Repository
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Title Bar */}
      <div className="title-bar">
        <span className="title-bar__title">{repoInfo?.name || 'GitFlow'}</span>
      </div>

      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar" style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }}>
          {/* Repository Info */}
          <div className="sidebar__header">
            <div className="repo-info">
              <div className="repo-info__name">
                <FolderGit2 size={18} />
                {repoInfo?.name}
              </div>
              <div className="repo-info__path">{repoInfo?.path}</div>
              <div className="repo-info__branch">
                <GitBranch size={14} />
                {repoInfo?.branch}
                {status && status.ahead > 0 && (
                  <span style={{ marginLeft: 8, color: 'var(--accent-green)' }}>↑{status.ahead}</span>
                )}
                {status && status.behind > 0 && (
                  <span style={{ marginLeft: 4, color: 'var(--accent-yellow)' }}>↓{status.behind}</span>
                )}
              </div>
            </div>
          </div>

          {/* Branches */}
          <div className="sidebar__content">
            <div className="sidebar__title" onClick={() => setBranchesExpanded(!branchesExpanded)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {branchesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Branches
            </div>
            {branchesExpanded && branches && (
              <ul className="branch-list">
                {branches.all.map(branchName => (
                  <li
                    key={branchName}
                    className={`branch-item ${branchName === branches.current ? 'branch-item--active' : ''}`}
                    onClick={() => branchName !== branches.current && handleCheckout(branchName)}
                  >
                    <GitBranch size={16} />
                    <span>{branchName}</span>
                    {branchName === branches.current && <Check size={14} style={{ marginLeft: 'auto' }} />}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Sidebar Resize Handle */}
        <div
          className="resize-handle resize-handle--vertical"
          onMouseDown={startResizeSidebar}
        />

        {/* Main Content */}
        <main className="main-content" style={{ marginLeft: 0 }}>
          {/* Toolbar */}
          <div className="toolbar">
            <div className="toolbar__group">
              <button className="toolbar-btn" onClick={handleOpenRepository} title="Open Repository">
                <Folder size={18} />
              </button>
              <button className="toolbar-btn" onClick={handleRefresh} disabled={loading} title="Refresh">
                <RefreshCw size={18} className={loading ? 'spinning' : ''} />
              </button>
            </div>

            <div className="toolbar__divider" />

            <div className="toolbar__group">
              <button className="toolbar-btn" onClick={handleFetch} disabled={loading} title="Fetch">
                <Download size={18} />
                Fetch
              </button>
              <button className="toolbar-btn" onClick={handlePull} disabled={loading} title="Pull">
                <Download size={18} />
                Pull
              </button>
              <button className="toolbar-btn toolbar-btn--primary" onClick={handlePush} disabled={loading} title="Push">
                <Upload size={18} />
                Push
              </button>
            </div>

            <div className="toolbar__divider" />

            <div className="toolbar__group">
              <button className="toolbar-btn" onClick={handleStash} disabled={loading} title="Stash">
                <Archive size={18} />
              </button>
              <button className="toolbar-btn" onClick={handleStashPop} disabled={loading} title="Stash Pop">
                <RotateCcw size={18} />
              </button>
            </div>

            <div style={{ flex: 1 }} />

            <div className="toolbar__group">
              <button className="toolbar-btn" title="Search">
                <Search size={18} />
              </button>
              <button className="toolbar-btn" title="Settings">
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="content-area">
            {/* Changes/History Panel */}
            <div className="changes-panel" style={{ width: changesPanelWidth, minWidth: changesPanelWidth, maxWidth: changesPanelWidth }}>
              {/* Tabs */}
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'changes' ? 'tab--active' : ''}`}
                  onClick={() => setActiveTab('changes')}
                >
                  Changes
                </button>
                <button
                  className={`tab ${activeTab === 'history' ? 'tab--active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  History
                </button>
              </div>

              {activeTab === 'changes' ? (
                <>
                  {/* Staged Files */}
                  <div className="changes-section">
                    <div className="changes-section__header">
                      <span>Staged Changes</span>
                      <span className="changes-panel__count">{getStagedFiles().length}</span>
                    </div>
                    {getStagedFiles().map(file => (
                      <div
                        key={file.path}
                        className={`file-item ${selectedFile === file.path ? 'file-item--selected' : ''}`}
                        onClick={() => handleFileSelect(file.path)}
                      >
                        {getFileIcon(file.index)}
                        <span className="file-item__name">{file.path.split('/').pop()}</span>
                        <button
                          className="file-item__action"
                          onClick={(e) => { e.stopPropagation(); handleUnstage(file.path); }}
                          title="Unstage"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Unstaged Files */}
                  <div className="changes-section">
                    <div className="changes-section__header">
                      <span>Unstaged Changes</span>
                      <span className="changes-panel__count">{getUnstagedFiles().length}</span>
                    </div>
                    {getUnstagedFiles().map(file => (
                      <div
                        key={file.path}
                        className={`file-item ${selectedFile === file.path ? 'file-item--selected' : ''}`}
                        onClick={() => handleFileSelect(file.path)}
                      >
                        {getFileIcon(file.working_dir)}
                        <span className="file-item__name">{file.path.split('/').pop()}</span>
                        <button
                          className="file-item__action"
                          onClick={(e) => { e.stopPropagation(); handleStage(file.path); }}
                          title="Stage"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Commit Panel */}
                  <div className="commit-panel">
                    <textarea
                      className="commit-panel__textarea"
                      placeholder="Commit message..."
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                    />
                    <div className="commit-panel__actions">
                      <button
                        className="commit-btn"
                        onClick={handleCommit}
                        disabled={loading || !commitMessage.trim() || getStagedFiles().length === 0}
                      >
                        Commit
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* History Tab */
                <div className="history-list">
                  {logs.map((commit, index) => (
                    <div
                      key={commit.hash}
                      className={`commit-item ${selectedCommit === commit.hash ? 'commit-item--selected' : ''}`}
                      onClick={() => handleCommitSelect(commit.hash)}
                    >
                      <div className="commit-item__graph">
                        <div className="commit-item__dot" />
                        {index < logs.length - 1 && <div className="commit-item__line" />}
                      </div>
                      <div className="commit-item__content">
                        <div className="commit-item__message">{commit.message}</div>
                        <div className="commit-item__meta">
                          <span className="commit-item__hash">{commit.hash.substring(0, 7)}</span>
                          <span className="commit-item__author">
                            <User size={12} />
                            {commit.author_name}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} />
                            {new Date(commit.date).toLocaleDateString()}
                          </span>
                        </div>
                        {commit.refs && (
                          <div className="commit-item__tags">
                            {commit.refs.split(',').map(ref => {
                              const trimmedRef = ref.trim();
                              if (trimmedRef.includes('HEAD')) {
                                return <span key={trimmedRef} className="tag tag--branch">{trimmedRef}</span>;
                              }
                              if (trimmedRef.includes('origin/')) {
                                return <span key={trimmedRef} className="tag tag--remote">{trimmedRef}</span>;
                              }
                              return <span key={trimmedRef} className="tag tag--tag">{trimmedRef}</span>;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Commit Files Panel - shown when a commit is selected */}
              {activeTab === 'history' && selectedCommit && commitFiles.length > 0 && (
                <div className="changes-section" style={{ borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
                  <div className="changes-section__header">
                    <span>Files Changed</span>
                    <span className="changes-panel__count">{commitFiles.length}</span>
                  </div>
                  {commitFiles.map(file => (
                    <div
                      key={file.path}
                      className={`file-item ${selectedFile === file.path ? 'file-item--selected' : ''}`}
                      onClick={() => handleFileSelect(file.path)}
                    >
                      {getFileIcon(file.status)}
                      <span className="file-item__name">{file.path.split('/').pop()}</span>
                      <span className="file-item__path" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
                        {file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resize Handle for Changes Panel */}
            <div
              className="resize-handle resize-handle--vertical"
              onMouseDown={startResizeChanges}
            />

            {/* Diff Viewer */}
            <div className="diff-viewer" style={{ flex: 1 }}>
              {selectedFile && (
                <div className="diff-viewer__header">
                  <span className="diff-viewer__filename">
                    <FileText size={16} />
                    {selectedFile}
                  </span>
                </div>
              )}
              {renderDiff()}
            </div>
          </div>
        </main>
      </div>

      {/* Toasts */}
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          {toast.type === 'success' && <Check size={18} />}
          {toast.type === 'error' && <X size={18} />}
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default App;
