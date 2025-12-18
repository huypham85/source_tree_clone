// Type definitions for the Git API exposed via Electron preload

export interface GitStatus {
    not_added: string[];
    conflicted: string[];
    created: string[];
    deleted: string[];
    modified: string[];
    renamed: { from: string; to: string }[];
    staged: string[];
    files: FileStatus[];
    ahead: number;
    behind: number;
    current: string;
    tracking: string | null;
}

export interface FileStatus {
    path: string;
    index: string;
    working_dir: string;
}

export interface GitBranch {
    current: string;
    all: string[];
    branches: Record<string, BranchInfo>;
}

export interface BranchInfo {
    current: boolean;
    name: string;
    commit: string;
    label: string;
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

export interface GitLog {
    all: GitLogEntry[];
    latest: GitLogEntry | null;
    total: number;
}

export interface GitRemote {
    name: string;
    refs: {
        fetch: string;
        push: string;
    };
}

export interface RepoInfo {
    path: string;
    name: string;
    branch: string;
    remotes: GitRemote[];
    status: GitStatus;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    canceled?: boolean;
    path?: string;
}

export interface ElectronAPI {
    // Repository operations
    openRepository: (path: string) => Promise<ApiResponse>;
    selectFolder: () => Promise<ApiResponse<string>>;
    getRepoInfo: () => Promise<ApiResponse<RepoInfo>>;

    // Status and info
    getStatus: () => Promise<ApiResponse<GitStatus>>;
    getBranches: () => Promise<ApiResponse<GitBranch>>;
    getLog: (count?: number) => Promise<ApiResponse<GitLog>>;
    getDiff: (file?: string) => Promise<ApiResponse<string>>;
    getRemotes: () => Promise<ApiResponse<GitRemote[]>>;
    getCurrentBranch: () => Promise<ApiResponse<string>>;
    getCommitDetails: (hash: string) => Promise<ApiResponse<{ diff: string, files: Array<{ status: string, path: string }>, hash: string }>>;
    getFileDiffForCommit: (hash: string, file: string) => Promise<ApiResponse<string>>;

    // Staging operations
    stage: (files: string | string[]) => Promise<ApiResponse>;
    unstage: (files: string | string[]) => Promise<ApiResponse>;

    // Commit operations
    commit: (message: string) => Promise<ApiResponse>;

    // Remote operations
    pull: () => Promise<ApiResponse>;
    push: () => Promise<ApiResponse>;
    fetch: () => Promise<ApiResponse>;
    clone: (url: string, targetPath: string) => Promise<ApiResponse>;

    // Branch operations
    checkout: (branch: string) => Promise<ApiResponse>;
    createBranch: (branchName: string) => Promise<ApiResponse>;

    // Stash operations
    stash: () => Promise<ApiResponse>;
    stashPop: () => Promise<ApiResponse>;

    // Config operations
    getConfig: () => Promise<ApiResponse<{
        local: { userName: string; userEmail: string };
        global: { userName: string; userEmail: string };
    }>>;
    setConfig: (key: string, value: string, isGlobal?: boolean) => Promise<ApiResponse>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
