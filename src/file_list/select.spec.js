import { assert } from 'chai';
import sinon from 'sinon';
import { FileList } from './file_list';

describe("fileList.Select", function() {
  var fileList;
  beforeEach(function() {
    fileList = new FileList("#file");
  });

  describe('#selectedToCSV()', function() {
    it("converts selected items to CSV", function() {
      var files = [{
        file: {
          name: "test.jpg",
          path: "/path/to/test.jpg"
        },
        result: {
          parsed: {
            date: "2016-01-05",
            amount: "500.00"
          }
        }
      }, {
        file: {
          name: "test2.jpg",
          path: "/path/to/test2.jpg"
        },
        result: {
          error: "Couldn't parse"
        }
      }];

      sinon.stub(fileList.Select, 'selected', function() {
        return [1];
      });
      sinon.stub(fileList, 'getFileForElement', function() {
        return files[1];
      });

      var expected = "Name\tAmount\tDate\tPath\n" +
        "test2.jpg\t\t\t/path/to/test2.jpg\n";

      assert.include(fileList.Select.selectedToCSV(), expected);
    });
  });
});
