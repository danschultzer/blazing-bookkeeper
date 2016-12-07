import path from 'path'
import url from 'url'
import { app, Menu, ipcMain, shell } from 'electron'
import env from './env'
import { appMenuTemplate, editMenuTemplate, windowMenuTemplate, devMenuTemplate, helpMenuTemplate } from './menu/templates'
import createWindow from './helpers/window'
import crashReporter from './helpers/crash_reporter'
import thirdpartyEnv from './utils/thirdparty_env'

Object.assign(process.env, thirdpartyEnv)
console.log('Settings thirdparty environment variables:', thirdpartyEnv)

var mainWindow, editWindow, reportWindow

var setApplicationMenu = () => {
  var menus = [
    editMenuTemplate,
    windowMenuTemplate
  ]

  // macOS menu
  if (process.platform === 'darwin') {
    menus.unshift(appMenuTemplate)
  }

  // Developer menu
  if (env.name === 'development') {
    menus.push(devMenuTemplate)
  }

  menus.push(helpMenuTemplate)

  Menu.setApplicationMenu(Menu.buildFromTemplate(menus))
}

if (env.name !== 'production') {
  var userDataPath = app.getPath('userData')
  app.setPath('userData', userDataPath + ' (' + env.name + ')')
}

var openWindow = (windowName, file, opts) => {
  opts = opts || {}
  opts.width = opts.width || 500
  opts.height = opts.height || 400
  opts.minWidth = opts.minWidth || 400
  opts.minHeight = opts.minHeight || 310
  opts.titleBarStyle = opts.titleBarStyle || 'hidden'

  var win = createWindow(windowName, opts)

  blur(win, windowName + '-blur')

  win.loadURL(url.format({
    pathname: path.join(__dirname, file),
    protocol: 'file:',
    slashes: true
  }))

  if (env.name === 'development') {
    win.openDevTools()
  }

  return win
}

var blur = (windowName, eventName) => {
  windowName.on('blur', () => windowName.webContents.send(eventName))
}

app.on('ready', () => {
  crashReporter()
  setApplicationMenu()

  mainWindow = openWindow('main', 'app.html', { width: 640, height: 480 })

  mainWindow.on('focus', () => {
    mainWindow.webContents.send('main-focus')
    if (editWindow) {
      editWindow.focus()
      if (reportWindow) {
        reportWindow.focus()
      }
      shell.beep()
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })

  ipcMain.on('display-edit', (event, arg) => {
    if (!arg[1].done || editWindow) return

    global.editObjectIndex = arg[0]
    global.editObject = arg[1]

    setApplicationMenu()

    editWindow = openWindow('edit', 'edit.html', { parentWindow: mainWindow })

    editWindow.on('focus', () => {
      editWindow.webContents.send('edit-focus')
      if (reportWindow) {
        reportWindow.focus()
        shell.beep()
      }
    })

    editWindow.on('closed', () => {
      editWindow = null
      setApplicationMenu()
    })

    var resizeId
    editWindow.on('resize', () => {
      editWindow.webContents.send('edit-resizing')
      clearTimeout(resizeId)
      resizeId = setTimeout(() => {
        if (editWindow) {
          editWindow.webContents.send('edit-resized')
        }
      }, 750)
    })
  })

  ipcMain.on('edit-updated', (event, arg) => {
    if (!editWindow) return

    mainWindow.webContents.send('edit-updated', {
      index: global.editObjectIndex,
      updated: arg
    })
  })

  ipcMain.on('close-edit', event => editWindow.close())

  ipcMain.on('display-report', (event, file) => {
    if (reportWindow) return

    global.reportFile = file

    setApplicationMenu()

    reportWindow = openWindow('report', 'report.html', { parentWindow: editWindow })

    reportWindow.on('focus', () => reportWindow.webContents.send('report-focus'))

    reportWindow.on('closed', () => {
      reportWindow = null
      setApplicationMenu()
    })
  })

  ipcMain.on('close-report', event => reportWindow.close())
})

app.on('window-all-closed', () => app.quit())
