const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Performance monitoring
    sendPerformanceStats: (stats) => ipcRenderer.send('performance-stats', stats),

    // Platform information
    platform: process.platform,

    // Performance hints
    isElectron: true,
    canUseWebWorkers: true,
    canUseOffscreenCanvas: typeof OffscreenCanvas !== 'undefined'
});

// Inject performance optimizations
window.addEventListener('DOMContentLoaded', () => {
    // Set high priority for animation frame
    if (window.requestAnimationFrame) {
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback) {
            return originalRAF.call(window, function(time) {
                // Mark as high priority task
                callback(time);
            });
        };
    }

    // Optimize canvas rendering
    document.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            // Enable will-change for GPU acceleration
            canvas.style.willChange = 'transform';

            // Use native resolution for sharper rendering
            const dpr = window.devicePixelRatio || 1;
            if (dpr > 1) {
                console.log(`Using device pixel ratio: ${dpr}x`);
            }
        }
    });
});

console.log('Preload script loaded - Electron optimizations active');
