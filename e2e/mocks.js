const path = require('path')
const electron = require('electron')
electron.dialog.showOpenDialog = (opts, cb) => {
  cb([path.join(__dirname, '/support/readable.pdf')])
}
