import { remote, webFrame, ipcRenderer } from 'electron';
import JSONFormatter from 'json-formatter-js';
import Vue from 'vue';
import jetpack from 'fs-jetpack';
import request from 'request';
import env from './env';

require('./helpers/crash_reporter.js')(env);
require('./helpers/context_menu');
require('./helpers/external_links');

webFrame.setZoomLevelLimits(1, 1); // Don't allow any pinch zoom

document.addEventListener('DOMContentLoaded', function () {
  global.file = remote.getGlobal('reportFile');
  global.file.anonymized = document.body.querySelector('[name="anonymized"]').checked;
  global.file.uploading = false;

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
  if (global.file.uploading) {
    console.log("Already uploading report.");
    return;
  }

  var body = {
    file: fileObject(),
    comments: document.querySelector('[name="comments"]').value
  };

  var multipart = [{
    'content-type': 'application/json',
  }];

  if (!global.file.anonymized) {
    multipart.push({ body: jetpack.createReadStream(global.file.file.path) });
    body.email = document.querySelector('[name="email"]').value;
  }
  multipart[0].body = JSON.stringify(body);
  console.log(multipart);

  global.file.uploading = request({
    method: 'PUT',
    preambleCRLF: true,
    postambleCRLF: true,
    uri: 'https://localhost/error-report/upload',
    multipart: multipart
  },
  function (error, response, body) {
    global.file.uploading = false;
    if (error) {
      console.log("Error: " + error);
      return alert("Could not send report. Please check your internet connection, or try again later.");
    }
    close();
  });
}

function close() {
  ipcRenderer.send("close-report");
}

function fileObject() {
  var fileJSON = {};
  fileJSON = {
    name: global.file.file.name,
    parsed: global.file.result.parsed
  };
  if (global.file.result.error) {
    fileJSON.error = global.file.result.error.json;
  }

  if (global.file.anonymized) {
    fileJSON.error = JSON.stringify(fileJSON.error)
      .replace(new RegExp(process.cwd(), "g"), "~");
    fileJSON.error = JSON.parse(fileJSON.error);
  }

  return fileJSON;
}

function render() {
  var formatter,
    fileJSON = fileObject();

  var results = document.body.querySelector('.json.results');
  if (results) {
    formatter = new JSONFormatter(fileJSON.parsed, [0], { hoverPreviewEnabled: true, hoverPreviewFieldCount: 0});
    results.innerHTML = "";
    results.appendChild(formatter.render());
  }

  var fullError = document.body.querySelector('.json.full-error');
  if (fullError) {
    var errorJSON;
    formatter = new JSONFormatter(fileJSON.error, [0], { hoverPreviewEnabled: true, hoverPreviewFieldCount: 0});
    fullError.innerHTML = "";
    fullError.appendChild(formatter.render());
  }
}
