// Simple wrapper exposing environment variables to rest of the code.

import jetpack from 'fs-jetpack';

// The variables have been written to `env.json` by the build process.
var env = jetpack.cwd(__dirname).read('env.json', 'json');

// Set 3rd party binaries and libraries
process.env.PATH = [
  __dirname + "/thirdparty/dependencies/bin",
  __dirname + "/thirdparty/poppler/bin:",
  __dirname + "/thirdparty/opencv/bin:",
  __dirname + "/thirdparty/tesseract/bin:"
].join(':');

process.env.DYLD_LIBRARY_PATH = [
  "/System/Library/Frameworks/ImageIO.framework/Versions/A/Resources/", // Core Graphics package
  __dirname + "/thirdparty/dependencies/lib",
  __dirname + "/thirdparty/poppler/lib",
  __dirname + "/thirdparty/opencv/lib",
  __dirname + "/thirdparty/tesseract/lib"
].join(':');

process.env.TESSDATA_PREFIX = __dirname + "/thirdparty/tesseract/share/tessdata";

export default env;
