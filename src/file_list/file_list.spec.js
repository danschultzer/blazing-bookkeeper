import { assert } from 'chai';
import sinon from 'sinon';
import jetpack from 'fs-jetpack';
import { FileList } from './file_list';
import scanner from 'receipt-scanner';

describe("fileList", function() {
  var fileList;
  beforeEach(function() {
    sinon.stub(scanner.prototype, 'parse');
    fileList = new FileList("#file");
    fileList.files.$set = function() {}; // We don't use vue in this unit test
    sinon.stub(fileList, 'createSmoothPercentProgressionInterval'); // We don't want to run progress interval
    sinon.stub(jetpack, 'createReadStream'); // We don't want files to actually load
  });

  afterEach(function() {
    scanner.prototype.parse.restore();
    jetpack.createReadStream.restore();
    fileList.createSmoothPercentProgressionInterval.restore();
  });

  describe('#createSmoothPercentProgressionInterval', function() {
    var interval,
      checkAfter = function(done, callback, timeout) {
         setTimeout(function() {
            try {
              callback();
              done();
            } catch(e) {
              done(e);
            }
          }, timeout || 15);
      };

    beforeEach(function() {
      fileList.addFile("readable.jpg", "/path/to/readable.jpg", 1345000);
      fileList.createSmoothPercentProgressionInterval.restore();
      interval = fileList.createSmoothPercentProgressionInterval(fileList.files[0].index);
    });

    afterEach(function() {
      interval.clear();
      sinon.stub(fileList, 'createSmoothPercentProgressionInterval'); // We don't want to run progress interval
    });

    it('should smooth update progress after 15ms', function(done) {
      assert.equal(0, fileList.files[0].progressBar);
      fileList.files[0].percentDone = 0.1;
      assert.equal(0, fileList.files[0].progressBar);
      checkAfter(done, function() {
        assert.equal(false, interval.cleared);
        assert.equal(1, fileList.files[0].progressBar);
      });
    });

    it('doesn\'t increase above max percent', function(done) {
      fileList.files[0].percentDone = 0.1;
      checkAfter(done, function() {
        assert.equal(10, fileList.files[0].progressBar);
      }, 15*20);
    });

    it('should stop interval after filed parsed', function(done) {
      fileList.files[0].done = true;
      assert.equal(false, interval.cleared);
      checkAfter(done, function() {
        assert.equal(true, interval.cleared);
      });
    });

    it('should stop interval after file removed', function(done) {
      fileList.files.pop();
      assert.equal(false, interval.cleared);
      checkAfter(done, function() {
        assert.equal(true, interval.cleared);
      });
    });
  });

  describe('#addFiles()', function() {

    beforeEach(function() {
      sinon.stub(fileList, "addFile");
    });

    afterEach(function() {
      fileList.addFile.restore();
    });

    it('should handle directories', function() {
      fileList.addFiles([__dirname + '/../resources/icons']);
      assert.equal(true, fileList.addFile.calledOnce);
      assert.equal(true, fileList.addFile.calledWith("512x512.png", __dirname + '/../resources/icons/512x512.png', 74799, 'image/png'));
    });

    it('should filter invalid files', function() {
      fileList.addFiles([__dirname + '/../resources']);
      assert.equal(4, fileList.addFile.callCount);
    });

    it('should filter non existing files', function() {
      fileList.addFiles(["/dir/dont/exist", "/file/dont/exist.jpg"]);
      assert.equal(false, fileList.addFile.called);
    });
  });

  describe('#addFile()', function() {
    var path = "/path/to/readable.jpg",
      name = "readable.jpg",
      filesize = 1345000;

    it("should add file to list", function() {
      fileList.addFile(name, path, filesize);
      assert.equal(1, fileList.files.length);
      assert.equal(false, fileList.files[0].done);
      assert.equal(name, fileList.files[0].file.name);
      assert.equal(path, fileList.files[0].file.path);
      assert.equal(filesize, fileList.files[0].file.filesize);
    });

    describe("when parsing finished", function() {
      var fileListFilesSet;

      beforeEach(function(done) {
        scanner.prototype.parse.restore();
        sinon.stub(scanner.prototype, 'parse', function(callback) {
          var parsed = {
            date: "2016-05-05",
            amount: "6,000.00"
          };

          callback(null, parsed);

          done();
        });

        fileListFilesSet = sinon.stub(fileList.files, "$set", function(index, object) {
          fileList.files[index] = object;
        });

        fileList.addFile(name, path, filesize);
      });


      afterEach(function() {
        fileListFilesSet.restore();
      });

      it("should create file stream", function() {
        assert.ok(jetpack.createReadStream.called);
      });

      it("should update vue object", function() {
        assert.ok(fileListFilesSet.called);
      });

      it("should update values in list", function() {
        assert.equal(true, fileList.files[0].done);
        assert.equal(null, fileList.files[0].result.error);
        assert.equal("2016-05-05", fileList.files[0].result.parsed.date);
        assert.equal("6,000.00", fileList.files[0].result.parsed.amount);
      });
    });

    describe("when file is removed from list", function() {
      describe("while file is procesing", function() {
        var callbacks = [];

        it("should not update file upon completion", function(done) {
          setTimeout(function() {
            scanner.prototype.parse.restore();
            sinon.stub(scanner.prototype, 'parse', function(callback) {
              callbacks.push(function(arg1, arg2) {
                callback(arg1, arg2);
              });
            });
            fileList.addFile(name, path, filesize);

            setTimeout(function() {
              assert.equal(callbacks.length, 1);
              fileList.removeFiles([fileList.files[0]]);
              fileList.addFile("readable.2.jpg", "/path/to/readable2.jpg", filesize);

              setTimeout(function() {
                assert.equal(callbacks.length, 2);
                assert.equal(fileList.files.length, 1);

                callbacks[1](null, {
                  test2: true
                });
                callbacks[0](null, {
                  test1: true
                });

                assert.equal(true, fileList.files[0].result.parsed.test2);

                done();
              }, 1);
            }, 1);
          }, 1);
        });
      });
    });
  });

  describe('#toCSV()', function() {
    it("returns CSV", function() {
      var files = [{
        file: {
          name: "csv-test.jpg",
          path: "/path/to/csv-test.jpg"
        },
        result: {
          parsed: {
            date: "2016-01-05",
            amount: "500.00"
          }
        }
      }, {
        file: {
          name: "csv-test-2.jpg",
          path: "/path/to/csv-test-2.jpg"
        },
        result: {
          error: "Couldn't parse"
        }
      }];

      var expected = "Name\tAmount\tDate\tPath\n" +
        "csv-test.jpg\t500.00\t2016-01-05\t/path/to/csv-test.jpg\n" +
        "csv-test-2.jpg\t\t\t/path/to/csv-test-2.jpg\n";

      assert.equal(expected, fileList.toCSV(files));
    });

    it("handles \\t in values", function() {
      var files = [{
        file: {
          name: "test\t.jpg",
          path: "/path/to/test.jpg"
        }
      }];

      assert.include(fileList.toCSV(files), '"test\t.jpg"');


    });

    it("handles \" in values", function() {
      var files = [{
        file: {
          name: "test\".jpg",
          path: "/path/to/test.jpg"
        }
      }];

      assert.include(fileList.toCSV(files), '"test\\".jpg"');
    });
  });

  describe('#toCSV()', function() {
    it("converts items to CSV", function() {
      var files = [{
        file: {
          name: "test2.jpg",
          path: "/path/to/test2.jpg"
        },
        result: {
          error: "Couldn't parse"
        }
      }];

      var expected = "Name\tAmount\tDate\tPath\n" +
        "test2.jpg\t\t\t/path/to/test2.jpg\n";

      assert.include(fileList.toCSV(files), expected);
    });
  });

  describe('#processQueue()', function() {
    beforeEach(function() {
      fileList.files.push({
        index: 0,
        file: {
          name: "test.jpg",
          path: "/path/to/test.jpg"
        },
        processing: false,
        done: false
      },
      {
        index: 1,
        file: {
          name: "test2.jpg",
          path: "/path/to/test2.jpg"
        },
        processing: false,
        done: false
      },
      {
        index: 2,
        file: {
          name: "test3.jpg",
          path: "/path/to/test3.jpg"
        },
        processing: false,
        done: false
      });
    });

    afterEach(function() {
      fileList.files = [];
    });

    it("should only run two files at any given time", function() {
      assert.equal(0, fileList.processingCount());
      fileList.processQueue();
      assert.equal(2, fileList.processingCount());
      fileList.processQueue();
      assert.equal(2, fileList.processingCount());
    });
  });
});
