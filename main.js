const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
  ipcMain,
  shell,
  dialog,
} = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");

const Store = require("./Store");

const preferences = new Store({
  configName: "user-preferences",
  defaults: {
    destination: path.join(os.homedir(), "zuukkAudios"),
  },
});

let destination = preferences.get("destination");

const isDev =
  process.env.NODE_ENV !== undefined && process.env.NODE_ENV === "development"
    ? true
    : false;

const isApple = process.platform === "darwin" ? true : false;

function createPreferenceWindow() {
  const preferenceWindow = new BrowserWindow({
    width: isDev ? 950 : 500,
    resizable: isDev ? true : false,
    height: 150,
    backgroundColor: "#234",
    show: false,
    icon: path.join(__dirname, "assets", "icons", "icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  preferenceWindow.loadFile("./src/preferences/index.html");
  preferenceWindow.once("ready-to-show", () => {
    preferenceWindow.show();
    isDev && preferenceWindow.webContents.openDevTools();
    preferenceWindow.webContents.send("dest-path-update", destination);
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: isDev ? 950 : 500,
    resizable: isDev ? true : false,
    height: 300,
    backgroundColor: "#234",
    show: false,
    icon: path.join(__dirname, "assets", "icons", "icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  window.loadFile("./src/mainWindow/index.html");
  isDev && window.webContents.openDevTools();

  window.once("ready-to-show", () => {
    window.show();
  });
  const menuTemplate = [
    {
      label: app.name,
      submenu: [
        {
          label: "Preferences",
          click: () => {
            createPreferenceWindow();
          },
        },
        {
          label: "Open destination folder",
          click: () => {
            shell.openPath(destination);
          },
        },
      ],
    },
    {
      label: "File",
      submenu: [isApple ? { role: "close" } : { role: "quit" }],
    },
    {
      label: "Window",
      submenu: [
        {
          label: "New Window",
          accelerator: "CmdOrCtrl+n",
          click: () => createWindow(),
        },

        { type: "separator" },
        {
          label: "Close All",
          accelerator: "CmdOrCtrl+q",
          click: () =>
            BrowserWindow.getAllWindows().forEach((window) => window.close()),
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
});
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
app.on("window-all-closed", () => {
  !isApple && app.quit();
});
app.on("activate", () => {
  BrowserWindow.getAllWindows().length === 0 && createWindow();
});

ipcMain.on("open_new_window", () => {
  createWindow();
});

ipcMain.on("save_buffer", (e, buffer) => {
  const filePath = path.join(destination, `${Date.now()}`);
  fs.writeFileSync(`${filePath}.webm`, buffer);
});

ipcMain.handle("show-dialog", async (event) => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  const dirPath = result.filesPath[0];
  preference.set("destination", dirPath);
  destination = preference.get("destination");
  return destination;
});
