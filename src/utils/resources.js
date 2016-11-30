import path from 'path'

var getResourcesPath = function () {
  var paths = Array.from(arguments)

  if (/[\\/]Electron\.app[\\/]/.test(process.execPath)) {
      // Development mode resources are located in project root.
    paths.unshift(process.cwd())
  } else {
      // In builds the resources directory is located in 'Contents/Resources'
    paths.unshift(process.resourcesPath)
  }

  return path.join.apply(null, paths)
}

export default getResourcesPath
