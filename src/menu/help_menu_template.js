import { shell } from 'electron'

export default {
  role: 'help',
  submenu: [
    {
      label: 'Learn More',
      click: function () { shell.openExternal('https://github.com/danschultzer/blazing-bookkeeper') }
    }
  ]
}
