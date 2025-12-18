import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // Repository operations
    openRepository: (path) => ipcRenderer.invoke('git:openRepository', path),
    selectFolder: () => ipcRenderer.invoke('git:selectFolder'),
    getRepoInfo: () => ipcRenderer.invoke('git:getRepoInfo'),

    // Status and info
    getStatus: () => ipcRenderer.invoke('git:getStatus'),
    getBranches: () => ipcRenderer.invoke('git:getBranches'),
    getLog: (count) => ipcRenderer.invoke('git:getLog', count),
    getDiff: (file) => ipcRenderer.invoke('git:getDiff', file),
    getRemotes: () => ipcRenderer.invoke('git:getRemotes'),
    getCurrentBranch: () => ipcRenderer.invoke('git:getCurrentBranch'),

    // Staging operations
    stage: (files) => ipcRenderer.invoke('git:stage', files),
    unstage: (files) => ipcRenderer.invoke('git:unstage', files),

    // Commit operations
    commit: (message) => ipcRenderer.invoke('git:commit', message),

    // Remote operations
    pull: () => ipcRenderer.invoke('git:pull'),
    push: () => ipcRenderer.invoke('git:push'),
    fetch: () => ipcRenderer.invoke('git:fetch'),
    clone: (url, targetPath) => ipcRenderer.invoke('git:clone', url, targetPath),

    // Branch operations
    checkout: (branch) => ipcRenderer.invoke('git:checkout', branch),
    createBranch: (branchName) => ipcRenderer.invoke('git:createBranch', branchName),

    // Stash operations
    stash: () => ipcRenderer.invoke('git:stash'),
    stashPop: () => ipcRenderer.invoke('git:stashPop'),
});
