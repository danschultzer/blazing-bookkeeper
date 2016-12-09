// This helper remembers the size and position of your windows (and restores
// them in that place after app relaunch).
// Can be used for more than one window, just construct many
// instances of it and give each different name.

import { app, BrowserWindow, screen } from 'electron'
import jetpack from 'fs-jetpack'

function createWindow (name, options) {
  var userDataDir = jetpack.cwd(app.getPath('userData'))
  var stateStoreFile = 'window-state-' + name + '.json'
  var defaultSize = {
    width: options.width,
    height: options.height
  }
  var state = {}
  var win

  function restore () {
    var restoredState = {}
    try {
      restoredState = userDataDir.read(stateStoreFile, 'json')
    } catch (err) {
            // For some reason json can't be read (might be corrupted).
            // No worries, we have defaults.
    }
    return Object.assign({}, defaultSize, restoredState)
  }

  function getCurrentPosition () {
    var position = win.getPosition()
    var size = win.getSize()
    return {
      x: position[0],
      y: position[1],
      width: size[0],
      height: size[1]
    }
  }

  function windowWithinBounds (windowState, bounds) {
    return windowState.x >= bounds.x &&
            windowState.y >= bounds.y &&
            windowState.x + windowState.width <= bounds.x + bounds.width &&
            windowState.y + windowState.height <= bounds.y + bounds.height
  }

  function resetToDefaults (windowState) {
    var bounds = screen.getPrimaryDisplay().bounds
    return Object.assign({}, defaultSize, {
      x: (bounds.width - defaultSize.width) / 2,
      y: (bounds.height - defaultSize.height) / 2
    })
  }

  function ensureVisibleOnSomeDisplay (windowState) {
    var visible = screen.getAllDisplays().some(display => {
      return windowWithinBounds(windowState, display.bounds)
    })
    if (!visible) {
            // Window is partially or fully not visible now.
            // Reset it to safe defaults.
      return resetToDefaults(windowState)
    }
    return windowState
  }

  function saveState () {
    if (!win.isMinimized() && !win.isMaximized()) {
      Object.assign(state, getCurrentPosition())
    }
    userDataDir.write(stateStoreFile, state, { atomic: true })
  }

  state = ensureVisibleOnSomeDisplay(restore())

  win = new BrowserWindow(Object.assign({}, options, state))

  win.on('close', saveState)

  return win
}

export default createWindow
