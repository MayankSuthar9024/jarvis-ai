const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow = null;
let savedBounds = { width: 1000, height: 800 };

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    transparent: true,
    frame: false,
    hasShadow: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#00000000',
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC channel to toggle companion mode resizing
ipcMain.on('set-companion-mode', (event, isCompanion) => {
  if (!mainWindow) return;

  if (isCompanion) {
    // Save current size to restore later
    savedBounds = mainWindow.getBounds();

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workArea;

    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setResizable(false);
    mainWindow.setMinimizable(false);
    mainWindow.setMaximizable(false);
    
    // Position bottom-right above the taskbar
    mainWindow.setBounds({
      x: width - 230,
      y: height - 230,
      width: 220,
      height: 220
    });
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setResizable(true);
    mainWindow.setMinimizable(true);
    mainWindow.setMaximizable(true);
    
    // Restore size and center or reset to saved position
    mainWindow.setBounds({
      x: savedBounds.x || 100,
      y: savedBounds.y || 100,
      width: Math.max(800, savedBounds.width),
      height: Math.max(600, savedBounds.height)
    });

    if (savedBounds.width === 1000 && savedBounds.height === 800) {
      mainWindow.center();
    }
  }
});

ipcMain.on('window-minimize', () => {
  if (mainWindow && !mainWindow.isMinimized()) mainWindow.minimize();
});

ipcMain.on('window-toggle-maximize', () => {
  if (!mainWindow || !mainWindow.isResizable()) return;

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});
