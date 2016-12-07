import { BrowserWindow } from 'electron'

const devMenuTemplate = {
  label: 'Development',
  submenu: [{
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click: () => BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache()
  }, {
    label: 'Toggle DevTools',
    accelerator: 'Alt+CmdOrCtrl+I',
    click: () => BrowserWindow.getFocusedWindow().toggleDevTools()
  }]
}

export default devMenuTemplate
