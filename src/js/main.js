const {
  app,
  BrowserWindow,
  ipcMain,
  Notification,
  Tray,
  protocol,
  Menu,
  shell,
  nativeImage,
  screen,
} = require("electron");
const path = require("node:path");
const os = require("os");
const fs = require("fs");
let tray = null,
  win = null;

let bluetoothPinCallback;
let selectBluetoothCallback;

const createWindow = () => {
  win = new BrowserWindow({
    width: 1200,
    height: 680,
    minWidth: 1200, // Chiều rộng tối thiểu
    minHeight: 680, // Chiều cao tối thiểu
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "../img/mes.png"),
    frame: false,
    webPreferences: {
      devTools: true,
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  const iconPath = path.join(__dirname, "../img/mes.png");
  // win.loadURL("http://localhost:4443");
  win.loadURL("http://localhost:6500?fistLoad=true");
  // win.loadURL("http://10.103.196.60");
  // win.loadURL('https://ipays.vn')
  win.tray = new Tray(nativeImage.createFromPath(iconPath));
  win.tray.setIgnoreDoubleClickEvents(true);
  win.tray.on("click", (e) => {
    if (win.isVisible()) {
      win.focus();
    } else {
      win.show();
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    console.log(url);
    openNewWindow(url);
  });
  const menu = new Menu();
  ipcMain.on("resize", (event, resizable) => {
    if (win) {
      win.setMinimizable(resizable); // Vô hiệu hóa nút minimize
      win.setMaximizable(resizable); // Vô hiệu hóa nút maximize
      win.setResizable(resizable); // Vô hiệu hóa việc thay đổi kích thước (restore)
    }
  });
  // ipcMain.on('cancel-bluetooth-request', (event) => {
  //   selectBluetoothCallback('')
  // })

  // // Listen for a message from the renderer to get the response for the Bluetooth pairing.
  // ipcMain.on('bluetooth-pairing-response', (event, response) => {
  //   bluetoothPinCallback(response)
  // })

  // ipcMain.webContents.session.setBluetoothPairingHandler((details, callback) => {
  //   console.log("bluetooth connection")
  //   bluetoothPinCallback = callback
  //   // Send a message to the renderer to prompt the user to confirm the pairing.
  //   ipcMain.webContents.send('bluetooth-pairing-request', details)
  // })
  // Lắng nghe sự kiện ipc.newWindow
  ipcMain.on("newMessage", (event, data) => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    let newWindow = new BrowserWindow({
      width: data.width,
      height: data.height,
      titleBarStyle: "hidden",
      icon: path.join(__dirname, "../img/mes.png"),
      frame: false,
      x: width - data.width - 5, // Vị trí X (bottom-right)
      y: height - data.height - 5, // Vị trí Y (bottom-right)
      webPreferences: {
        devTools: true,
        webviewTag: true,
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
      },
    });
    newWindow.loadURL(data.link); // Mở link trong cửa sổ mới
  });
  ipcMain.on("newWindow", (event, data) => {
    let newWindow = new BrowserWindow({
      width: data.width,
      height: data.height,
      titleBarStyle: "hidden",
      icon: path.join(__dirname, "../img/mes.png"),
      frame: false,
      webPreferences: {
        devTools: true,
        webviewTag: true,
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
      },
    });
    newWindow.loadURL(data.link); // Mở link trong cửa sổ mới
  });
  ipcMain.on("size", (evt, arg) => {
    console.log(arg);
    // win.setSize(arg.width, arg.height);
  });
  ipcMain.on("chrome", (evt, arg) => {
    console.log(arg);
    shell.openExternal(arg);
  });
  ipcMain.on("minimize", (evt, arg) => {
    const win = BrowserWindow.getFocusedWindow(); // Lấy cửa sổ hiện tại (đang được focus)
    if (win) {
      win.minimize();
    }
  });
  ipcMain.on("maximized", (evt, arg) => {
    const win = BrowserWindow.getFocusedWindow(); // Lấy cửa sổ hiện tại (đang được focus)
    if (win) {
      if (win.isMaximized()) {
      } else {
        win.maximize();
      }
    }
  });
  ipcMain.on("unmaximize", (evt, arg) => {
    const win = BrowserWindow.getFocusedWindow(); // Lấy cửa sổ hiện tại (đang được focus)
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
      }
    }
  });
  ipcMain.on("maximize", (evt, arg) => {
    const win = BrowserWindow.getFocusedWindow(); // Lấy cửa sổ hiện tại (đang được focus)
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });
  ipcMain.on("unmaximize", (evt, arg) => {
    const win = BrowserWindow.getFocusedWindow(); // Lấy cửa sổ hiện tại (đang được focus)
    if (win) {
      win.unmaximize();
    }
  });
  ipcMain.on("reload", (evt, arg) => {
    const win = BrowserWindow.getFocusedWindow(); // Lấy cửa sổ hiện tại (đang được focus)
    if (win) {
      win.webContents.reloadIgnoringCache();
    }
  });
  ipcMain.on("close", (evt, arg) => {
    if (BrowserWindow.getAllWindows().length === 1) {
      win.hide();
    } else {
      app.quit();
    }
  });
  ipcMain.on("exit", (evt, arg) => {
    const win = BrowserWindow.getFocusedWindow(); // Lấy cửa sổ hiện tại (đang được focus)
    if (win) {
      win.close(); // Đóng cửa sổ đó
    }
  });
  ipcMain.on("Notice", (evt, arg) => {
    console.log(evt, arg);
    showNotification(arg.title, arg.subtitle, arg.body, arg.url);
  });
  ipcMain.on("OpenFile", (evt, arg) => {
    console.log(evt, arg);
  });
  ipcMain.on("CheckFile", (evt, arg) => {
    if (fs.existsSync(arg.replace(/\\/g, "\\\\"))) {
      try {
        shell.showItemInFolder(arg);
      } catch (e) {}
    } else {
      console.log(arg, "File already not exists");
      invokeFunctionInRenderer({
        type: "error",
        message: "This file has been removed!",
      });
    }
  });
  ipcMain.on("link", (evt, arg) => {
    openNewWindow(arg);
  });
  // Build menu from template
  // const actions = {
  //   bar: function () {
  //       console.log("bar");
  //   },
  //   about: function () {
  //       console.log("about");
  //   }
  // };
  // const mainMenuTemplate = require("./menu.js")(actions);
  // const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // // Insert menu
  // Menu.setApplicationMenu(mainMenu);
  win.webContents.session.on("will-download", (event, item, webContents) => {
    // Set the save path, making Electron not to prompt a save dialog.
    // console.log(item)
    var path_save = path.join(
      path.join(os.homedir(), "Documents"),
      "/MES saved/" +
        item.getMimeType().split("/")[0] +
        "/" +
        item.getFilename()
    );
    item.on("updated", (event, state) => {
      if (state === "interrupted") {
        console.log("Download is interrupted but can be resumed");
      } else if (state === "progressing") {
        if (item.isPaused()) {
          console.log("Download is paused");
        } else {
          console.log(`Received bytes: ${item.getReceivedBytes()}`);
        }
      }
    });
    item.setSavePath(path_save); // get the filename from item object and provide here according to your loic
    item.once("done", (event, state) => {
      if (state === "completed") {
        invokeFunctionInRenderer({
          name: item.getFilename(),
          path: item.getSavePath(),
          created: new Date(),
        });
        console.log("Download successfully", item.getSavePath());
        shell.showItemInFolder(item.getSavePath());
        invokeFunctionInRenderer({
          type: "downloaded",
          message: "Downloaded!",
        });
      } else {
        console.log(`Download failed: ${state}`);
      }
    });
  });
  // Function to call the function in the renderer process
  function invokeFunctionInRenderer(message) {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      console.log(message);
      windows[0].webContents.send("message-from-main", message);
    }
  }
  function showNotification(title, subtitle, body, url = "") {
    if (isWin()) {
      app.setAppUserModelId("MES applications");
    }
    if (Notification.isSupported()) {
      var notification = new Notification({
        title: title,
        icon: path.join(__dirname, "../img/mes.png"),
        subtitle: subtitle,
        body: body,
        silent: false,
      });
      notification.show();
      notification.on("click", (event, arg) => {
        win.loadURL("http://localhost:4443" + url);
        if (win.isMinimized()) {
          win.restore();
        }
      });
    }
  }
};
app.whenReady().then(() => {
  // Register the custom protocol
  // if (app.setAsDefaultProtocolClient('mes')) {
  //   console.log('Successfully registered mes:// protocol');
  // } else {
  //   console.log('Failed to register mes:// protocol');
  // }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

function openNewWindow(url) {
  let newWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "../img/mes.png"),
    frame: false,
    webPreferences: {
      devTools: true,
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  newWindow.loadURL(url);
  if (newWindow.isMaximized()) {
  } else {
    newWindow.maximize();
  }
}
// Handle the custom URL when the app is already running
app.on("open-url", (event, url) => {
  event.preventDefault();
  console.log("Custom URL scheme opened:", url);
  // Handle the URL as needed
  // shell.openExternal(url);  // Or handle it differently within your app
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
function isWin() {
  if (process.platform === "win32") {
    return true;
  } else {
    return false;
  }
}
// Function to smoothly expand the window
function smoothMaximize(win) {
  let { width, height } = win.getBounds();
  const { width: screenWidth, height: screenHeight } =
    require("electron").screen.getPrimaryDisplay().workAreaSize;
  const interval = 10; // Interval in ms
  const step = 20; // Pixels to increase in each step

  const timer = setInterval(() => {
    // Stop if the window has reached the screen size
    if (width >= screenWidth && height >= screenHeight) {
      win.setSize(screenWidth, screenHeight);
      win.center();
      clearInterval(timer);
      return;
    }

    // Gradually increase the size of the window
    width = Math.min(width + step, screenWidth);
    height = Math.min(height + step, screenHeight);

    win.setSize(width, height);
    win.center();
  }, interval);
}
