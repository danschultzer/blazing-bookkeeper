import { remote, webFrame, ipcRenderer, nativeImage } from 'electron';
import JSONFormatter from 'json-formatter-js';
import Vue from 'vue';

require('./helpers/context_menu');
require('./helpers/external_links');

webFrame.setZoomLevelLimits(1, 1); // Don't allow any pinch zoom

document.addEventListener('DOMContentLoaded', function () {
  global.file = remote.getGlobal('reportFile');

  var formatter = new JSONFormatter(global.file.result.error.json, [0], { hoverPreviewEnabled: true, hoverPreviewFieldCount: 0});

  var mainView = new Vue({
    el: '#main',
    data: {
      file: global.file
    },
    methods: {
      close: close,
      send: send
    },
    compiled: function() {
      document.getElementById('json').appendChild(formatter.render());
    }
  });

  ipcRenderer.on('report-blur', function(event) {
    if (!document.body.classList.contains('blurred')) document.body.classList.add('blurred');
  });

  ipcRenderer.on('report-focus', function(event) {
    if (document.body.classList.contains('blurred')) document.body.classList.remove('blurred');
  });

});


function send() {
  close();
}

function close() {
  ipcRenderer.send("close-report");
}
