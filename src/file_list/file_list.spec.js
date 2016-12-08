/* eslint-env mocha */
import { assert } from 'chai'
import path from 'path'
import sinon from 'sinon'
import jetpack from 'fs-jetpack'
import scanner from 'receipt-scanner'
import { FileList } from './file_list'

describe('fileList', function () {
  var fileList
  beforeEach(function () {
    sinon.stub(scanner.prototype, 'parse')
    fileList = new FileList('#file')
    fileList.files.$set = function () {} // We don't use vue in this unit test
    sinon.stub(fileList, 'createSmoothPercentProgressionInterval') // We don't want to run progress interval
    sinon.stub(jetpack, 'createReadStream') // We don't want files to actually load
  })

  afterEach(function () {
    scanner.prototype.parse.restore()
    jetpack.createReadStream.restore()
    fileList.createSmoothPercentProgressionInterval.restore()
  })

  describe('#addFiles()', function () {
    beforeEach(function () {
      sinon.stub(fileList, 'addFile')
    })

    afterEach(function () {
      fileList.addFile.restore()
    })

    it('handle directories', function () {
      fileList.addFiles([path.join(__dirname, '/../resources/icons')])
      assert.equal(fileList.addFile.calledOnce, true)
      assert.equal(fileList.addFile.calledWith('512x512.png', path.join(__dirname, '/../resources/icons/512x512.png'), 74799, 'image/png'), true)
    })

    it('filter invalid files', function () {
      fileList.addFiles([path.join(__dirname, '/../resources')])
      assert.equal(fileList.addFile.callCount, 4)
    })

    it('filter non existing files', function () {
      fileList.addFiles([path.join('/dir/dont/exist', '/file/dont/exist.jpg')])
      assert.equal(fileList.addFile.called, false)
    })
  })

  describe('#createSmoothPercentProgressionInterval()', function () {
    var interval
    var checkAfter = function (done, callback, timeout) {
      setTimeout(function () {
        try {
          callback()
          done()
        } catch (e) {
          done(e)
        }
      }, timeout || 15)
    }

    beforeEach(function () {
      fileList.addFile('readable.jpg', '/path/to/readable.jpg', 1345000)
      fileList.createSmoothPercentProgressionInterval.restore()
      interval = fileList.createSmoothPercentProgressionInterval(fileList.files[0].index)
    })

    afterEach(function () {
      interval.clear()
      sinon.stub(fileList, 'createSmoothPercentProgressionInterval') // We don't want to run progress interval
    })

    it('smooth update progress after 15ms', function (done) {
      assert.equal(fileList.files[0].progressBar, 0)
      fileList.files[0].percentDone = 0.1
      assert.equal(fileList.files[0].progressBar, 0)
      checkAfter(done, function () {
        assert.equal(interval.cleared, false)
        assert.equal(fileList.files[0].progressBar, 1)
      })
    })

    it('not increase above max percent', function (done) {
      fileList.files[0].percentDone = 0.1
      checkAfter(done, function () {
        assert.equal(fileList.files[0].progressBar, 10)
      }, 15 * 20)
    })

    it('stop interval after file parsed', function (done) {
      fileList.files[0].done = true
      assert.equal(interval.cleared, false)
      checkAfter(done, function () {
        assert.equal(interval.cleared, true)
      })
    })

    it('stop interval after file removed', function (done) {
      fileList.files.pop()
      assert.equal(interval.cleared, false)
      checkAfter(done, function () {
        assert.equal(interval.cleared, true)
      })
    })
  })

  describe('#addFile()', function () {
    var path = '/path/to/readable.jpg'
    var name = 'readable.jpg'
    var filesize = 1345000

    it('add file to list', function () {
      fileList.addFile(name, path, filesize)
      assert.equal(fileList.files.length, 1)
      assert.equal(fileList.files[0].done, false)
      assert.equal(fileList.files[0].file.name, name)
      assert.equal(fileList.files[0].file.path, path)
      assert.equal(fileList.files[0].file.filesize, filesize)
    })

    describe('when parsing finished', function () {
      var fileListFilesSet

      beforeEach(function (done) {
        scanner.prototype.parse.restore()
        sinon.stub(scanner.prototype, 'parse', function (callback) {
          var parsed = {
            date: '2016-05-05',
            amount: '6,000.00'
          }
          callback(null, parsed)

          done()
        })

        fileListFilesSet = sinon.stub(fileList.files, '$set', function (index, object) {
          fileList.files[index] = object
        })

        fileList.addFile(name, path, filesize)
      })

      afterEach(function () {
        fileListFilesSet.restore()
      })

      it('create file stream', function () {
        assert.ok(jetpack.createReadStream.called)
      })

      it('update vue object', function () {
        assert.ok(fileListFilesSet.called)
      })

      it('update values in list', function () {
        assert.equal(fileList.files[0].done, true)
        assert.equal(fileList.files[0].result.error, null)
        assert.equal(fileList.files[0].result.parsed.date, '2016-05-05')
        assert.equal(fileList.files[0].result.parsed.amount, '6,000.00')
      })
    })

    describe('during parsing', function () {
      beforeEach(function (done) {
        sinon.stub(scanner.prototype, 'ticker', function (callback) {
          callback(0.5, 1000)
          done()
          return this
        })
        fileList.addFile('readable.jpg', '/path/to/readable.jpg', 1345000)
      })

      afterEach(function () {
        scanner.prototype.ticker.restore()
      })

      it('update percentDone', function () {
        assert.equal(fileList.files[0].percentDone, 0.5)
      })
    })

    describe('when file is removed from list', function () {
      describe('while file is procesing', function () {
        var callbacks = []

        it('not update file upon completion', function (done) {
          setTimeout(function () {
            scanner.prototype.parse.restore()
            sinon.stub(scanner.prototype, 'parse', function (callback) {
              callbacks.push(function (arg1, arg2) {
                callback(arg1, arg2)
              })
            })
            fileList.addFile(name, path, filesize)

            setTimeout(function () {
              assert.equal(callbacks.length, 1)
              fileList.removeFiles([fileList.files[0]])
              fileList.addFile('readable.2.jpg', '/path/to/readable2.jpg', filesize)

              setTimeout(function () {
                assert.equal(callbacks.length, 2)
                assert.equal(fileList.files.length, 1)

                callbacks[1](null, {
                  test2: true
                })
                callbacks[0](null, {
                  test1: true
                })

                assert.equal(fileList.files[0].result.parsed.test2, true)

                done()
              }, 1)
            }, 1)
          }, 1)
        })
      })
    })
  })

  describe('#processQueue()', function () {
    beforeEach(function () {
      fileList.files.push({
        index: 0,
        file: {
          name: 'test.jpg',
          path: '/path/to/test.jpg'
        },
        processing: false,
        done: false
      },
        {
          index: 1,
          file: {
            name: 'test2.jpg',
            path: '/path/to/test2.jpg'
          },
          processing: false,
          done: false
        },
        {
          index: 2,
          file: {
            name: 'test3.jpg',
            path: '/path/to/test3.jpg'
          },
          processing: false,
          done: false
        })
    })

    afterEach(function () {
      fileList.files = []
    })

    it('only run two files at any given time', function () {
      assert.equal(fileList.processingCount(), 0)
      fileList.processQueue()
      assert.equal(fileList.processingCount(), 2)
      fileList.processQueue()
      assert.equal(fileList.processingCount(), 2)
    })
  })

  describe('#results()', function () {
    it('return results', function () {
      fileList.files = [{
        done: true,
        result: {
          parsed: {
            amount: '10.00',
            date: '2016-01-30'
          }
        }
      }, {
        done: true,
        result: {
          parsed: {
            amount: '10.00'
          }
        }
      }, {
        done: false
      }, {
        done: true,
        result: {
          error: 'invalid'
        }
      }]
      var results = fileList.results()
      assert.equal(results.done.total, 3)
      assert.equal(results.done.successful, 1)
      assert.equal(results.done.failures, 1)
      assert.equal(results.processing.total, 1)
    })
  })

  describe('#toCSV()', function () {
    it('return CSV', function () {
      var files = [{
        file: {
          name: 'csv-test.jpg',
          path: '/path/to/csv-test.jpg'
        },
        result: {
          parsed: {
            date: '2016-01-05',
            amount: '500.00'
          }
        }
      }, {
        file: {
          name: 'csv-test-2.jpg',
          path: '/path/to/csv-test-2.jpg'
        },
        result: {
          error: 'Couldn\'t parse'
        }
      }]

      var expected = 'Name\tAmount\tDate\tPath\n' +
        'csv-test.jpg\t500.00\t2016-01-05\t/path/to/csv-test.jpg\n' +
        'csv-test-2.jpg\t\t\t/path/to/csv-test-2.jpg\n'

      assert.equal(fileList.toCSV(files), expected)
    })

    it('handle \\t in values', function () {
      var files = [{
        file: {
          name: 'test\t.jpg',
          path: '/path/to/test.jpg'
        }
      }]

      assert.include(fileList.toCSV(files), 'test\t.jpg')
    })

    it('handle " in values', function () {
      var files = [{
        file: {
          name: 'test".jpg',
          path: '/path/to/test.jpg'
        }
      }]

      assert.include(fileList.toCSV(files), 'test\\".jpg')
    })
  })

  describe('#toCSV()', function () {
    it('convert item to CSV', function () {
      var files = [{
        file: {
          name: 'test2.jpg',
          path: '/path/to/test2.jpg'
        },
        result: {
          error: 'Couldn\'t parse'
        }
      }]

      var expected = 'Name\tAmount\tDate\tPath\n' +
        'test2.jpg\t\t\t/path/to/test2.jpg\n'

      assert.include(fileList.toCSV(files), expected)
    })
  })
})
