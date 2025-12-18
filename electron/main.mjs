import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { simpleGit } from 'simple-git';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let git = null;
let currentRepoPath = null;

// Helper function to serialize objects for IPC
const serialize = (obj) => JSON.parse(JSON.stringify(obj));

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#0f0f0f',
        show: false,
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

const registerIpcHandlers = () => {
    ipcMain.handle('git:openRepository', async (_, repoPath) => {
        try {
            if (!fs.existsSync(repoPath)) {
                throw new Error('Directory does not exist');
            }
            git = simpleGit(repoPath);
            const isRepo = await git.checkIsRepo();
            if (!isRepo) {
                throw new Error('Not a git repository');
            }
            currentRepoPath = repoPath;
            return { success: true, path: repoPath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:selectFolder', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory'],
            title: 'Select Git Repository',
        });

        if (result.canceled || result.filePaths.length === 0) {
            return { success: false, canceled: true };
        }

        return { success: true, path: result.filePaths[0] };
    });

    ipcMain.handle('git:getStatus', async () => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            const status = await git.status();
            // Serialize to plain object for IPC
            return { success: true, data: serialize(status) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:getBranches', async () => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            const branches = await git.branchLocal();
            return { success: true, data: serialize(branches) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:getLog', async (_, count = 50) => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            const log = await git.log({ maxCount: count });
            return { success: true, data: serialize(log) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:getLogWithGraph', async (_, count = 100) => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            // Get log with custom format for graph parsing
            // %H: Hash, %P: Parents, %an: Author Name, %ae: Author Email, %cI: Date ISO, %d: Refs, %s: Subject
            const customFormat = '%H|%P|%an|%ae|%cI|%d|%s';
            const logOutput = await git.raw(['log', '--all', `-n ${count}`, `--format=${customFormat}`]);

            // Get all branches
            const branches = await git.branch(['-a', '-v']);

            return {
                success: true,
                data: {
                    logOutput,
                    branches: serialize(branches)
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:getDiff', async (_, file) => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            if (file) {
                // Try to get diff for the specific file
                // First try unstaged changes
                let diff = await git.diff([file]);

                // If no unstaged diff, try staged changes
                if (!diff || diff.trim() === '') {
                    diff = await git.diff(['--cached', file]);
                }

                // If still no diff, the file might be untracked - show full content
                if (!diff || diff.trim() === '') {
                    const status = await git.status();
                    const isUntracked = status.not_added.includes(file) ||
                        status.files.some(f => f.path === file && f.working_dir === '?');
                    if (isUntracked) {
                        // For untracked files, read the file content
                        const fs = await import('fs/promises');
                        const filePath = path.join(currentRepoPath, file);
                        try {
                            const content = await fs.readFile(filePath, 'utf-8');
                            diff = `New file: ${file}\n\n${content.split('\n').map((line, i) => `+${line}`).join('\n')}`;
                        } catch (e) {
                            diff = `Unable to read file: ${file}`;
                        }
                    }
                }

                return { success: true, data: diff };
            } else {
                // Get all diffs
                const diff = await git.diff();
                return { success: true, data: diff };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:stage', async (_, files) => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            await git.add(files);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:unstage', async (_, files) => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            await git.reset(['HEAD', '--', ...(Array.isArray(files) ? files : [files])]);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:commit', async (_, message) => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            const result = await git.commit(message);
            return { success: true, data: serialize(result) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:commitAmend', async (_, message) => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            let result;
            if (message && message.trim()) {
                // Amend with new message
                result = await git.raw(['commit', '--amend', '-m', message]);
            } else {
                // Amend keeping current message
                result = await git.raw(['commit', '--amend', '--no-edit']);
            }
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:pull', async () => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            const result = await git.pull();
            return { success: true, data: serialize(result) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:push', async () => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            // Get current branch
            const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
            const currentBranch = branch.trim();

            // Try regular push first
            try {
                const result = await git.push();
                return { success: true, data: serialize(result) };
            } catch (pushError) {
                // If no upstream, set it and push again
                if (pushError.message.includes('no upstream branch') ||
                    pushError.message.includes('has no upstream')) {
                    const result = await git.push(['--set-upstream', 'origin', currentBranch]);
                    return { success: true, data: serialize(result) };
                }
                throw pushError;
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:checkout', async (_, branch) => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            await git.checkout(branch);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:createBranch', async (_, branchName) => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            await git.checkoutLocalBranch(branchName);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:fetch', async () => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            await git.fetch();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:stash', async () => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            await git.stash();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:stashPop', async () => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            await git.stash(['pop']);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:clone', async (_, url, targetPath) => {
        try {
            await simpleGit().clone(url, targetPath);
            return { success: true, path: targetPath };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:getRemotes', async () => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            const remotes = await git.getRemotes(true);
            return { success: true, data: serialize(remotes) };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:getCurrentBranch', async () => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            const branch = await git.revparse(['--abbrev-ref', 'HEAD']);
            return { success: true, data: branch.trim() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:getCommitDetails', async (_, commitHash) => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            // Get the diff for this specific commit
            const diffResult = await git.diff([`${commitHash}^`, commitHash]);

            // Get list of files changed in this commit
            const showResult = await git.show([
                commitHash,
                '--name-status',
                '--pretty=format:'
            ]);

            // Parse the file changes
            const files = showResult
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const parts = line.split('\t');
                    return {
                        status: parts[0],
                        path: parts[1] || parts[0],
                    };
                })
                .filter(f => f.path && f.path !== f.status);

            return {
                success: true,
                data: serialize({
                    diff: diffResult,
                    files,
                    hash: commitHash,
                })
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:getFileDiffForCommit', async (_, commitHash, filePath) => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            const diff = await git.diff([`${commitHash}^`, commitHash, '--', filePath]);
            return { success: true, data: diff };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:getRepoInfo', async () => {
        if (!git || !currentRepoPath) return { success: false, error: 'No repository opened' };
        try {
            const [branch, remotes, status] = await Promise.all([
                git.revparse(['--abbrev-ref', 'HEAD']),
                git.getRemotes(true),
                git.status(),
            ]);
            return {
                success: true,
                data: serialize({
                    path: currentRepoPath,
                    name: path.basename(currentRepoPath),
                    branch: branch.trim(),
                    remotes,
                    status,
                }),
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // Git Config handlers
    ipcMain.handle('git:getConfig', async () => {
        if (!git) return { success: false, error: 'No repository opened' };
        try {
            const userName = await git.raw(['config', '--local', 'user.name']).catch(() => '');
            const userEmail = await git.raw(['config', '--local', 'user.email']).catch(() => '');

            // Also get global config as fallback
            const globalName = await git.raw(['config', '--global', 'user.name']).catch(() => '');
            const globalEmail = await git.raw(['config', '--global', 'user.email']).catch(() => '');

            return {
                success: true,
                data: {
                    local: {
                        userName: userName.trim(),
                        userEmail: userEmail.trim(),
                    },
                    global: {
                        userName: globalName.trim(),
                        userEmail: globalEmail.trim(),
                    },
                },
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('git:setConfig', async (_, key, value, isGlobal = false) => {
        if (!git && !isGlobal) return { success: false, error: 'No repository opened' };
        try {
            const scope = isGlobal ? '--global' : '--local';
            const gitInstance = isGlobal ? simpleGit() : git;
            await gitInstance.raw(['config', scope, key, value]);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });
};

app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
