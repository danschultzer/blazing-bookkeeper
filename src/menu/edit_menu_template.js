import { BrowserWindow } from 'electron';

export default {
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
      role: 'copy'
    },
    {
      role: 'paste'
    },
    {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      click: function() {
          BrowserWindow.getFocusedWindow().webContents.executeJavaScript("document.dispatchEvent(new CustomEvent('selectAll'));");
      }
    }
  ]
};
