import { shell } from 'electron'

const helpMenuTemplate = {
  role: 'help',
  submenu: [{
    label: 'Learn More',
    click: () => shell.openExternal('https://github.com/danschultzer/blazing-bookkeeper')
  }]
}

export default helpMenuTemplate
