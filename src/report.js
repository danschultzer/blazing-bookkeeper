import { remote, webFrame, ipcRenderer } from 'electron';
import JSONFormatter from 'json-formatter-js';
import Vue from 'vue';

require('./helpers/context_menu');
require('./helpers/external_links');

webFrame.setZoomLevelLimits(1, 1); // Don't allow any pinch zoom

document.addEventListener('DOMContentLoaded', function () {
  global.file = remote.getGlobal('reportFile');
  global.file.anonymized = document.body.querySelector('[name="anonymized"]').checked;

  var mainView = new Vue({
    el: '#main',
    data: {
      file: global.file
    },
    methods: {
      close: close,
      send: send,
      changeAnonymized: function() {
        global.file.anonymized = document.body.querySelector('[name="anonymized"]').checked;
        render();
      }
    },
    compiled: render
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

function render() {
  var formatter;

  var results = document.body.querySelector('.json.results');
  if (results) {
    formatter = new JSONFormatter(global.file.result.parsed, [0], { hoverPreviewEnabled: true, hoverPreviewFieldCount: 0});
    results.innerHTML = "";
    results.appendChild(formatter.render());
  }

  var fullError = document.body.querySelector('.json.full-error');
  if (fullError) {
    var errorJSON;

    if (global.file.anonymized) {
      errorJSON = JSON.stringify(global.file.result.error.json)
        .replace(new RegExp(process.cwd(), "g"), "~");
      errorJSON = JSON.parse(errorJSON);
    } else {
      errorJSON = global.file.result.error.json;
    }

    formatter = new JSONFormatter(errorJSON, [0], { hoverPreviewEnabled: true, hoverPreviewFieldCount: 0});
    fullError.innerHTML = "";
    fullError.appendChild(formatter.render());
  }
}
