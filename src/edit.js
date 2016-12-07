import { remote, webFrame, ipcRenderer } from 'electron'
import Vue from 'vue'
import { PDFJS } from 'pdfjs-dist/build/pdf.combined'
import mime from 'mime'
import crashReporter from './helpers/crash_reporter'
import contextMenu from './menu/context_menu'

// Initialize
crashReporter()
contextMenu()

webFrame.setZoomLevelLimits(1, 1) // Don't allow any pinch zoom

document.addEventListener('DOMContentLoaded', () => {
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
      report: event => ipcRenderer.send('display-report', global.file)
    }
  })
  updatePreviewCanvas()

  var preview = document.getElementById('preview')
  ipcRenderer.on('edit-resizing', () => { preview.style.opacity = 0 })

  ipcRenderer.on('edit-resized', () => {
    preview.style.opacity = 1
    updatePreviewCanvas()
  })

  ipcRenderer.on('edit-blur', event => {
    if (!document.body.classList.contains('blurred')) document.body.classList.add('blurred')
  })

  ipcRenderer.on('edit-focus', event => {
    if (document.body.classList.contains('blurred')) document.body.classList.remove('blurred')
  })
})

var loadedPdf
var loadedImg
var updatePreviewCanvas = () => {
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
        PDFJS.getDocument(path).then(pdf => {
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
        img.onload = () => {
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

var renderPDF = (pdf, canvas, context, maxWidth, maxHeight) => {
  pdf.getPage(global.page).then(page => {
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

var renderImage = (img, canvas, context, maxWidth, maxHeight) => {
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

var save = () => {
  ipcRenderer.send('edit-updated', {
    amount: document.getElementById('amount').value,
    date: document.getElementById('date').value
  })
  close()
}

var close = () => ipcRenderer.send('close-edit')
