import getResourcesPath from './resources'

var thirdpartyPath = getResourcesPath('thirdparty'),
  env = {};

if (process.platform == 'darwin') {
  // Set 3rd party binaries and libraries
  env.PATH = [
    "$PATH",
    thirdpartyPath + "/dependencies/bin",
    thirdpartyPath + "/poppler/bin",
    thirdpartyPath + "/opencv/bin",
    thirdpartyPath + "/tesseract/bin"
  ].join(':');

  env.DYLD_LIBRARY_PATH = [
    "$DYLD_LIBRARY_PATH",
    "/System/Library/Frameworks/ImageIO.framework/Versions/A/Resources/", // Core Graphics package
    thirdpartyPath + "/dependencies/lib",
    thirdpartyPath + "/poppler/lib",
    thirdpartyPath + "/opencv/lib",
    thirdpartyPath + "/tesseract/lib"
  ].join(':');

  env.TESSDATA_PREFIX = thirdpartyPath + "/tesseract/share/tessdata";
}

export default env;
