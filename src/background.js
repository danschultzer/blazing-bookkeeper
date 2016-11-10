// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import { app, Menu, ipcMain, shell, BrowserWindow } from 'electron';
import { appMenuTemplate, editMenuTemplate, windowMenuTemplate, devMenuTemplate, helpMenuTemplate } from './menu/templates';
import createWindow from './helpers/window';
import thirdparty_env from './utils/thirdparty_env';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

Object.assign(process.env, thirdparty_env);
console.log('Settings thirdparty environment variables:', thirdparty_env);

var mainWindow, editWindow, reportWindow;

var setApplicationMenu = function() {
    var menus = [
      editMenuTemplate,
      windowMenuTemplate
    ];

    if (process.platform === 'darwin') {
      menus.unshift(appMenuTemplate);
    }

    // Developer menu
    if (env.name !== 'production') {
      menus.push(devMenuTemplate);
    }

    menus.push(helpMenuTemplate);

    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
  var userDataPath = app.getPath('userData');
  app.setPath('userData', userDataPath + ' (' + env.name + ')');
}

function openWindow(windowName, file, opts) {
  opts = opts || {};
  opts.width = opts.width || 500;
  opts.height = opts.height || 400;
  opts.minWidth = opts.minWidth || 400;
  opts.minHeight = opts.minHeight || 310;
  opts.titleBarStyle = opts.titleBarStyle || 'hidden';

  var win = createWindow(windowName, opts);

  blur(win, 'report-' + windowName);

  win.loadURL('file://' + __dirname + file);

  if (env.name === 'development') {
    win.openDevTools();
  }

  return win;
}

function blur(windowName, eventName) {
  windowName.on('blur', function() {
    windowName.webContents.send(eventName);
  });
}

app.on('ready', function() {
  require('./helpers/crash_reporter.js')(env);
  setApplicationMenu();

  mainWindow = openWindow('main', '/app.html', { width: 640, height: 480 });

  mainWindow.on('focus', function() {
    mainWindow.webContents.send('main-focus');
    if (editWindow) {
      editWindow.focus();
      if (reportWindow) {
        reportWindow.focus();
      }
      shell.beep();
    }
  });

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  ipcMain.on('display-edit', function(event, arg) {
    if (!arg[1].done || editWindow) return;

    global.editObjectIndex = arg[0];
    global.editObject = arg[1];

    setApplicationMenu();

    editWindow = openWindow('edit', '/edit.html', { parentWindow: mainWindow });

    editWindow.on('focus', function() {
      editWindow.webContents.send('edit-focus');
      if (reportWindow) {
        reportWindow.focus();
        shell.beep();
      }
    });

    editWindow.on('closed', function() {
      editWindow = null;
      setApplicationMenu();
    });

    var resizeId;
    editWindow.on('resize', function() {
      editWindow.webContents.send('edit-resizing');
      clearTimeout(resizeId);
      resizeId = setTimeout(function() {
        if (editWindow) {
          editWindow.webContents.send('edit-resized');
        }
      }, 750);
    });
  });

  ipcMain.on('edit-updated', function(event, arg) {
    if (!editWindow) return;

    mainWindow.webContents.send('edit-updated', {
      index: global.editObjectIndex,
      updated: arg
    });
  });

  ipcMain.on('close-edit', function(event) {
    editWindow.close();
  });

  ipcMain.on('display-report', function(event, file) {
    if (reportWindow) return;

    global.reportFile = file;

    setApplicationMenu();

    reportWindow = openWindow('report', '/report.html', { parentWindow: editWindow });

    reportWindow.on('focus', function() {
      reportWindow.webContents.send('report-focus');
    });

    reportWindow.on('closed', function() {
      reportWindow = null;
      setApplicationMenu();
    });
  });

  ipcMain.on('close-report', function(event) {
    reportWindow.close();
  });
});

app.on('window-all-closed', function() {
  app.quit();
});
