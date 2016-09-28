# Blazing Bookkeeper

[Electron powered](http://electron.atom.io) app that does accounting for you using [receipt-scanner](https://github.com/danschultzer/receipt-scanner). Build with [electron boilerplate](https://github.com/szwacz/electron-boilerplate)

[![CircleCI](https://img.shields.io/circleci/project/danschultzer/blazing-bookkeeper/master.svg)](https://circleci.com/gh/danschultzer/blazing-bookkeeper)
[![Codecov](https://img.shields.io/codecov/c/github/danschultzer/blazing-bookkeeper/master.svg)](https://codecov.io/gh/danschultzer/blazing-bookkeeper)
[![David (app)](https://david-dm.org/danschultzer/blazing-bookkeeper/status.svg?path=app)](https://david-dm.org/danschultzer/blazing-bookkeeper?path=app)
[![David (boilerplate)](https://david-dm.org/danschultzer/blazing-bookkeeper/dev-status.svg)](https://david-dm.org/danschultzer/blazing-bookkeeper?type=dev)


![](https://cloud.githubusercontent.com/assets/1254724/18614273/5b964992-7d40-11e6-991c-39e7ab7d25d9.gif)

### Unit tests

Using [electron-mocha](https://github.com/jprichardson/electron-mocha) test runner with the [chai](http://chaijs.com/api/assert/) assertion library. To run the tests go with standard:
```
npm test
```

All `*.spec.js` files in the `src` directory will be included.

### End to end tests

Using [mocha](https://mochajs.org/) test runner and [spectron](http://electron.atom.io/spectron/). Run with command:
```
npm run e2e
```
All `*.e2e.js` in `e2e` will be included.


### Code coverage

Using [istanbul](http://gotwarlost.github.io/istanbul/) code coverage tool. Run with command:
```
npm run coverage
```
You can set the reporter(s) by setting `ISTANBUL_REPORTERS` environment variable (defaults to `text-summary` and `html`). The report directory can be set with `ISTANBUL_REPORT_DIR` (defaults to `coverage`).

# Making a release

To make ready for distribution installer use command:
```
npm run release
```
It will start the packaging process for operating system you are running this command on. Ready for distribution file will be outputted to `dist` directory.

You can create Windows installer only when running on Windows, the same is true for Linux and OSX. So to generate all three installers you need all three operating systems.

All packaging actions are handled by [electron-builder](https://github.com/electron-userland/electron-builder).

## LICENSE

(The MIT License)

Copyright (c) 2016 Dan Schultzer, Benjamin Schultzer & the Contributors Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
