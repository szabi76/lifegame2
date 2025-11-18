const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

let mainWindow;

// Performance optimization: Enable GPU acceleration
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('disable-gpu-driver-bug-workarounds');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-canvas-2d-layers');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        minWidth: 1024,
        minHeight: 768,
        backgroundColor: '#0a0a1a',
        icon: path.join(__dirname, 'assets/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false,
            // Performance optimizations
            webgl: true,
            offscreen: true,
            backgroundThrottling: false, // Keep animation running when minimized
            disableBlinkFeatures: 'Auxclick' // Disable middle-click paste
        },
        show: false // Don't show until ready
    });

    // Load the index.html of the app
    mainWindow.loadFile('index.html');

    // Show window when ready to prevent flickering
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    // Performance: Disable default menu for faster startup
    Menu.setApplicationMenu(createApplicationMenu());

    // Open DevTools in development mode
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // Handle window close
    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Performance monitoring IPC
    ipcMain.on('performance-stats', (event, stats) => {
        // Could log or display performance stats
        console.log('Performance:', stats);
    });

    // Optimize renderer process
    mainWindow.webContents.on('did-finish-load', () => {
        // Set process priority to high for better performance
        mainWindow.webContents.setBackgroundThrottling(false);
    });
}

function createApplicationMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Exit',
                    accelerator: 'Alt+F4',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Fullscreen',
                    accelerator: 'F11',
                    click: () => {
                        const isFullscreen = mainWindow.isFullScreen();
                        mainWindow.setFullScreen(!isFullscreen);
                    }
                },
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => mainWindow.reload()
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: 'F12',
                    click: () => mainWindow.webContents.toggleDevTools()
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About Advanced Game of Life',
                            message: 'Advanced Game of Life v2.0',
                            detail: 'Performance-tuned Windows implementation\n' +
                                   'Featuring cellular automata, reaction-diffusion chemistry,\n' +
                                   'and advanced visual effects.\n\n' +
                                   'Built with Electron for native performance.'
                        });
                    }
                }
            ]
        }
    ];

    return Menu.buildFromTemplate(template);
}

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    // On macOS apps typically stay active until user quits explicitly
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Performance optimization: Disable hardware acceleration on problematic GPUs
app.on('gpu-process-crashed', (event, killed) => {
    console.error('GPU process crashed:', killed);
    // Could fallback to software rendering
});

// Clean up before quit
app.on('before-quit', () => {
    // Cleanup tasks if needed
    if (mainWindow) {
        mainWindow.removeAllListeners();
    }
});
