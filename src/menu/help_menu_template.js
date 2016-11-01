import { app, BrowserWindow } from 'electron';

export var helpMenuTemplate = {
  role: 'help',
  submenu: [
      {
        label: 'Learn More',
        click () {
          require('electron').shell.openExternal('https://github.com/danschultzer/blazing-bookkeeper');
        }
      }
    ]
};
