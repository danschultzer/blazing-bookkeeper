const electron = require('electron');
electron.dialog.showOpenDialog = (opts, cb) => {
  cb([__dirname + '/support/readable.pdf']);
};
