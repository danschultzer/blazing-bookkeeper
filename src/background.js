// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import { app, Menu, ipcMain, shell } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import createWindow from './helpers/window';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

var mainWindow, editWindow;

var setApplicationMenu = function () {
  var menus = [];
  if (!editWindow) menus = [editMenuTemplate];

    if (env.name !== 'production') {
        menus.push(devMenuTemplate);
    }

    if (process.platform === 'darwin') {
      const name = app.getName();
      menus.unshift({
        label: name,
        submenu: [
          {
            label: 'About ' + name,
            role: 'about'
          },
          {
            type: 'separator'
          },
          {
            label: 'Services',
            role: 'services',
            submenu: []
          },
          {
            type: 'separator'
          },
          {
            label: 'Hide ' + name,
            accelerator: 'Command+H',
            role: 'hide'
          },
          {
            label: 'Hide Others',
            accelerator: 'Command+Alt+H',
            role: 'hideothers'
          },
          {
            label: 'Show All',
            role: 'unhide'
          },
          {
            type: 'separator'
          },
          {
            label: 'Quit',
            accelerator: 'Command+Q',
            click() {
              if (editWindow) {
                editWindow.close();
              } else {
                app.quit();
              }
            }
          },
        ]
      });
      // Window menu.
      menus.push({
        label: 'Window',
        submenu: [
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        },
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Zoom',
          role: 'zoom'
        },
        {
          type: 'separator'
        },
        {
          label: 'Bring All to Front',
          role: 'front'
        }
      ]
    });
    }

    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
    var userDataPath = app.getPath('userData');
    app.setPath('userData', userDataPath + ' (' + env.name + ')');
}

app.on('ready', function () {
    setApplicationMenu();

    mainWindow = createWindow('main', {
        width: 500,
        height: 400,
        minWidth: 400,
        minHeight: 310,
        titleBarStyle: 'hidden'
    });

    mainWindow.on('blur', function() {
      mainWindow.webContents.send('main-blur');
    });

    mainWindow.on('focus', function() {
      mainWindow.webContents.send('main-focus');
      if (editWindow) {
        editWindow.focus();
        shell.beep();
      }
    });

    mainWindow.loadURL('file://' + __dirname + '/app.html');

    mainWindow.on('closed', function() {
      mainWindow = null;
    });

    if (env.name == 'development') {
      mainWindow.openDevTools();
    }

    ipcMain.on('display-edit', function(event, arg) {
      if (!arg[1].done || editWindow) return;

      global.editObjectIndex = arg[0];
      global.editObject = arg[1];

      editWindow = createWindow('edit', {
          width: 500,
          height: 400,
          minWidth: 400,
          minHeight: 310,
          parent: mainWindow,
          titleBarStyle: 'hidden'
      });

      setApplicationMenu();

      editWindow.on('blur', function() {
        editWindow.webContents.send('edit-blur');
      });

      editWindow.on('focus', function() {
        editWindow.webContents.send('edit-focus');
      });

      editWindow.loadURL('file://' + __dirname + '/edit.html');

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
      editWindow = null;
    });
});

app.on('window-all-closed', function () {
    app.quit();
});
