import { remote, webFrame, ipcRenderer } from 'electron'
import Vue from 'vue'
import { PDFJS } from 'pdfjs-dist/build/pdf.combined'
import mime from 'mime'
import env from './env'

require('./helpers/crash_reporter.js')(env)
require('./helpers/context_menu')
require('./helpers/external_links')

webFrame.setZoomLevelLimits(1, 1) // Don't allow any pinch zoom

document.addEventListener('DOMContentLoaded', function () {
  global.file = remote.getGlobal('editObject')
  global.page = 1
  new Vue({ // eslint-disable-line no-new
    el: '#main',
    data: {
      file: global.file
    },
    methods: {
      close: close,
      save: save,
      report: function (event) {
        ipcRenderer.send('display-report', global.file)
      }
    }
  })
  updatePreviewCanvas()

  var preview = document.getElementById('preview')
  ipcRenderer.on('edit-resizing', function () {
    preview.style.opacity = 0
  })

  ipcRenderer.on('edit-resized', function () {
    preview.style.opacity = 1
    updatePreviewCanvas()
  })

  ipcRenderer.on('edit-blur', function (event) {
    if (!document.body.classList.contains('blurred')) document.body.classList.add('blurred')
  })

  ipcRenderer.on('edit-focus', function (event) {
    if (document.body.classList.contains('blurred')) document.body.classList.remove('blurred')
  })
})

var loadedPdf
var loadedImg
function updatePreviewCanvas () {
  var canvas = document.getElementById('preview')
  var context = canvas.getContext('2d')
  var path = global.file.file.path
  var mimetype = mime.lookup(path)
  var boundingRect = canvas.parentNode.getBoundingClientRect()
  var maxWidth = boundingRect.width - 20
  var maxHeight = boundingRect.height - 20

  context.clearRect(0, 0, canvas.width, canvas.height)
  switch (true) {
    case mimetype === 'application/pdf':
      if (!loadedPdf) {
        PDFJS.getDocument(path).then(function (pdf) {
          loadedPdf = pdf
          renderPDF(loadedPdf, canvas, context, maxWidth, maxHeight)
        })
      } else {
        renderPDF(loadedPdf, canvas, context, maxWidth, maxHeight)
      }
      break
    case /^image\/.*/.test(mimetype):
      if (!loadedImg) {
        var img = new window.Image()
        img.onload = function () {
          loadedImg = img
          renderImage(loadedImg, canvas, context, maxWidth, maxHeight)
        }
        img.src = path
      } else {
        renderImage(loadedImg, canvas, context, maxWidth, maxHeight)
      }
      break
  }
}

function renderPDF (pdf, canvas, context, maxWidth, maxHeight) {
  pdf.getPage(global.page).then(function (page) {
    var ratio = 1
    var viewport = page.getViewport(1)
    if (viewport.height > maxHeight) {
      ratio = maxHeight / viewport.height
      viewport = page.getViewport(ratio)
    }
    if (viewport.width > maxWidth) {
      ratio = ratio * maxWidth / viewport.width
      viewport = page.getViewport(ratio)
    }
    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = canvas.width + 'px'
    canvas.style.height = canvas.height + 'px'

    var devicePixelRatio = window.devicePixelRatio || 1
    var backingStoreRatio = context.backingStorePixelRatio || 1
    var pixelRatio = devicePixelRatio / backingStoreRatio

    canvas.width = canvas.width * pixelRatio
    canvas.height = canvas.height * pixelRatio
    context.scale(pixelRatio, pixelRatio)

    page.render({
      canvasContext: context,
      viewport: page.getViewport(ratio)
    })
  })
}

function renderImage (img, canvas, context, maxWidth, maxHeight) {
  var ratio
  var height = img.height
  var width = img.width
  if (height > maxHeight) {
    ratio = maxHeight / height
    height = height * ratio
    width = width * ratio
  }
  if (width > maxWidth) {
    ratio = maxWidth / width
    height = height * ratio
    width = width * ratio
  }
  canvas.width = width
  canvas.height = height
  canvas.style.width = canvas.width + 'px'
  canvas.style.height = canvas.height + 'px'

  var devicePixelRatio = window.devicePixelRatio || 1
  var backingStoreRatio = context.backingStorePixelRatio || 1
  var pixelRatio = devicePixelRatio / backingStoreRatio
  canvas.width = canvas.width * pixelRatio
  canvas.height = canvas.height * pixelRatio
  context.scale(pixelRatio, pixelRatio)

  context.drawImage(img, 0, 0, width, height)
}

function save () {
  ipcRenderer.send('edit-updated', {
    amount: document.getElementById('amount').value,
    date: document.getElementById('date').value
  })
  close()
}

function close () {
  ipcRenderer.send('close-edit')
}
