import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Repository operations
    openRepository: (path: string) => ipcRenderer.invoke('git:openRepository', path),
    selectFolder: () => ipcRenderer.invoke('git:selectFolder'),
    getRepoInfo: () => ipcRenderer.invoke('git:getRepoInfo'),

    // Status and info
    getStatus: () => ipcRenderer.invoke('git:getStatus'),
    getBranches: () => ipcRenderer.invoke('git:getBranches'),
    getLog: (count?: number) => ipcRenderer.invoke('git:getLog', count),
    getDiff: (file?: string) => ipcRenderer.invoke('git:getDiff', file),
    getRemotes: () => ipcRenderer.invoke('git:getRemotes'),
    getCurrentBranch: () => ipcRenderer.invoke('git:getCurrentBranch'),

    // Staging operations
    stage: (files: string | string[]) => ipcRenderer.invoke('git:stage', files),
    unstage: (files: string | string[]) => ipcRenderer.invoke('git:unstage', files),

    // Commit operations
    commit: (message: string) => ipcRenderer.invoke('git:commit', message),

    // Remote operations
    pull: () => ipcRenderer.invoke('git:pull'),
    push: () => ipcRenderer.invoke('git:push'),
    fetch: () => ipcRenderer.invoke('git:fetch'),
    clone: (url: string, targetPath: string) => ipcRenderer.invoke('git:clone', url, targetPath),

    // Branch operations
    checkout: (branch: string) => ipcRenderer.invoke('git:checkout', branch),
    createBranch: (branchName: string) => ipcRenderer.invoke('git:createBranch', branchName),

    // Stash operations
    stash: () => ipcRenderer.invoke('git:stash'),
    stashPop: () => ipcRenderer.invoke('git:stashPop'),
});

// Type definitions for the exposed API
export interface GitStatus {
    not_added: string[];
    conflicted: string[];
    created: string[];
    deleted: string[];
    modified: string[];
    renamed: { from: string; to: string }[];
    staged: string[];
    files: { path: string; index: string; working_dir: string }[];
    ahead: number;
    behind: number;
    current: string;
    tracking: string | null;
}

export interface GitBranch {
    current: string;
    all: string[];
    branches: Record<string, { current: boolean; name: string; commit: string; label: string }>;
}

export interface GitLogEntry {
    hash: string;
    date: string;
    message: string;
    refs: string;
    body: string;
    author_name: string;
    author_email: string;
}

export interface GitRemote {
    name: string;
    refs: {
        fetch: string;
        push: string;
    };
}

export interface ElectronAPI {
    openRepository: (path: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    selectFolder: () => Promise<{ success: boolean; path?: string; canceled?: boolean }>;
    getRepoInfo: () => Promise<{ success: boolean; data?: any; error?: string }>;
    getStatus: () => Promise<{ success: boolean; data?: GitStatus; error?: string }>;
    getBranches: () => Promise<{ success: boolean; data?: GitBranch; error?: string }>;
    getLog: (count?: number) => Promise<{ success: boolean; data?: { all: GitLogEntry[] }; error?: string }>;
    getDiff: (file?: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    getRemotes: () => Promise<{ success: boolean; data?: GitRemote[]; error?: string }>;
    getCurrentBranch: () => Promise<{ success: boolean; data?: string; error?: string }>;
    stage: (files: string | string[]) => Promise<{ success: boolean; error?: string }>;
    unstage: (files: string | string[]) => Promise<{ success: boolean; error?: string }>;
    commit: (message: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    pull: () => Promise<{ success: boolean; data?: any; error?: string }>;
    push: () => Promise<{ success: boolean; data?: any; error?: string }>;
    fetch: () => Promise<{ success: boolean; error?: string }>;
    clone: (url: string, targetPath: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    checkout: (branch: string) => Promise<{ success: boolean; error?: string }>;
    createBranch: (branchName: string) => Promise<{ success: boolean; error?: string }>;
    stash: () => Promise<{ success: boolean; error?: string }>;
    stashPop: () => Promise<{ success: boolean; error?: string }>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
