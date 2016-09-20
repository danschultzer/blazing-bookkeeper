import { app, BrowserWindow } from 'electron';

export var editMenuTemplate = {
    label: 'Edit',
    submenu: [
      {
        role: 'undo'
      },
      {
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        role: 'cut'
      },
      {
        role: "copy"
      },
      {
        role: 'paste'
      },
      {
        role: "selectall"
      }
    ]
};
