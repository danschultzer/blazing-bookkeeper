// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { webFrame, remote, ipcRenderer, clipboard } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import Vue from 'vue';
import env from './env';
import { FileList } from './file_list/file_list';

require('./helpers/crash_reporter.js')(env);
require('./helpers/context_menu');

webFrame.setZoomLevelLimits(1, 1); // Don't allow any pinch zoom

console.log('Loaded environment variables:', env);

var app = remote.app,
  dialog = remote.dialog,
  appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files like it is node.js! Welcome to Electron world :)
console.log('The author of this app is:', appDir.read('package.json', 'json').author);

document.addEventListener('DOMContentLoaded', function () {
  global.fileList = new FileList('files');

  var summaryComponent = Vue.extend({}),
    fileListComponent = Vue.extend({}),
    toolbarComponent = Vue.extend({}),
    mainView = new Vue({
      el: '#main',
      data: {
        selectedFiles: global.fileList.selectedFiles,
        files: global.fileList.files
      },
      methods: {
        open: openFiles,
        selectAll: function() { global.fileList.Select.selectAll(); },
        deselectAll: function() { global.fileList.Select.deselectAll(); },
        selectUp: function(event) { global.fileList.Select.moveDirection('up', !event.shiftKey); },
        selectDown: function(event) { global.fileList.Select.moveDirection('down', !event.shiftKey); },
        handleCmdOrCtrlA: function(event) {
          if ((event.metaKey || e.ctrlKey) && event.keyCode === 65) {
            event.preventDefault();
            global.fileList.Select.selectAll();
          }
        },
        handleCmdOrCtrlDelete: function(event) {
          if ((event.metaKey || e.ctrlKey) && event.keyCode === 8) {
            event.preventDefault();
            global.fileList.Select.removeSelected();
          }
        },
        edit: function(event) {
          global.fileList.Select.select([event.currentTarget], true);
          var index = global.fileList.getIndexForElement(event.currentTarget),
            file = global.fileList.getFileForElement(event.currentTarget);
          if (!file.done) return;

          if (file.result.error) {
            file.result.error.json = JSON.parse(JSON.stringify(file.result.error, Object.getOwnPropertyNames(file.result.error)));
          }

          ipcRenderer.send('display-edit', [index, file]);
        },
        export: exportCSV,
        select: selectFiles
      },
      computed: {
        exportLabel: exportButtonLabel,
        result: global.fileList.results,
        successRateLabel: function() {
          var total = this.result.done.successful / (this.result.done.total || 1) * 100,
            color = total < 85 ? 'red' : total < 95 ? 'yellow' : 'green';
          return '<span class="color-' + color + '">' + total.toFixed(1) + '%</span>';
        }
      },
      components: {
        'file-list-component': fileListComponent,
        'summary-component': summaryComponent,
        'toolbar-component': toolbarComponent
      }
    });
  handleDragnDrop();

  ipcRenderer.on('edit-updated', function(event, arg) {
    var fileIndex = global.fileList.getFileIndexForIndex(arg.index),
    result = global.fileList.getFileForIndex(arg.index).result;
    result.updated = arg.updated;
    global.fileList.updateFile(arg.index, { result: result });
  });

  ipcRenderer.on('main-blur', function(event) {
    if (!document.body.classList.contains('blurred')) document.body.classList.add('blurred');
  });

  ipcRenderer.on('main-focus', function(event) {
    if (document.body.classList.contains('blurred')) document.body.classList.remove('blurred');
  });
});

document.addEventListener('copy', copySelectedToClipboard, true);

function selectFiles(event) {
  // If user does shift + click
  if (event.shiftKey) {
    global.fileList.Select.selectUntil(event.currentTarget);
  // If user does command + click
  } else if (event.metaKey || event.ctrlKey) {
    global.fileList.Select.toggleSelect(event.currentTarget);
  } else {
    global.fileList.Select.select([event.currentTarget], true);
  }
}

var openFilesDialog = false;
function openFiles() {
  if (openFilesDialog === true) return;
  openFilesDialog = true;

  dialog.showOpenDialog({
    properties: ['openFile', 'openDirectory', 'multiSelections'],
    filters: [
      { name: 'JPG', extensions: ['jpg', 'jpeg'] },
      { name: 'PNG', extensions: ['png'] },
      { name: 'PDF', extensions: ['pdf'] },
      { name: 'TIFF', extensions: ['tif', 'tiff'] },
      { name: 'BMP', extensions: ['bmp'] }
    ]
    },
    function(paths) {
      openFilesDialog = false;

      if (paths && paths.length) {
        global.fileList.addFiles(paths);
      }
  });
}

var saveFileDialog = false;
function exportCSV() {
  if (saveFileDialog === true) return;
  saveFileDialog = true;

  dialog.showSaveDialog({
    defaultPath: 'results.csv',
    filters: [
      { name: 'CSV', extensions: ['csv'] }
    ]
  }, function(filename) {
    saveFileDialog = false;
    if (filename) jetpack.write(filename, global.fileList.Select.selectedToCSV());
  });
}

function exportButtonLabel() {
  if (this.selectedFiles.length > 0) return 'Export ' + this.selectedFiles.length + ' item(s)';
  return 'Export';
}

function handleDragnDrop() {
  // Drag files
  document.ondragover = document.ondrop = function(ev) {
    ev.preventDefault();
  };

  document.body.ondrop = function(ev) {
    if (document.body.classList.contains('drag')) document.body.classList.remove('drag');

    if (ev.dataTransfer.files.length) {
      global.fileList.addFiles(ev.dataTransfer.files);
    }

    ev.preventDefault();
  };

  var dragCounter = 0;
  document.body.ondragenter = function(ev) {
    dragCounter++;
    if (!document.body.classList.contains('drag')) document.body.classList.add('drag');
  };
  document.body.ondragend = document.body.ondragleave = function(ev) {
    dragCounter--;
    if (dragCounter > 0) return;
    if (document.body.classList.contains('drag')) document.body.classList.remove('drag');
  };
}


function copySelectedToClipboard() {
  clipboard.writeText(fileList.Select.selectedToCSV(), 'text/csv');
}
