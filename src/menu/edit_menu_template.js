import { app, BrowserWindow } from 'electron';

export var editMenuTemplate = {
    label: 'Edit',
    submenu: [
      {
        label: "Copy",
        accelerator: "CmdOrCtrl+C",
        selector: "copy:"
      },
      {
        label: "Select All",
        accelerator: "CmdOrCtrl+A",
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.webContents.executeJavaScript("fileList.Select.selectAll();");
        }
      },
      {
        label: "Deselect All",
        accelerator: "CmdOrCtrl+D",
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.webContents.executeJavaScript("fileList.Select.deselectAll();");
        }
      },
      {
        label: "Remove Selected",
        accelerator: "CmdOrCtrl+Backspace",
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.webContents.executeJavaScript("fileList.Select.removeSelected();");
        }
      }
    ]
};
