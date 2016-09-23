import { assert } from 'chai';
import sinon from 'sinon';
import { FileList } from './file_list';

describe('fileList.Select', function() {
  var fileList, Select, filesContainer;
  beforeEach(function() {
    fileList = new FileList("#files");
    Select = fileList.Select;
    filesContainer = document.createElement("div");
    sinon.stub(Select, 'el', function() { return filesContainer; });
  });


  afterEach(function() {
    Select.el.restore();
  })

  describe('#select()', function() {
    var files;
    beforeEach(function() {
      filesContainer.innerHTML = '<div class="row"></div><div class="row"></div>';
      Select.select([filesContainer.firstChild]);
    });

    it("should select the row", function() {
      assert.equal(1, Select.selected().length);
    });

    describe("when selecting again", function() {
      beforeEach(function() {
        Select.select([filesContainer.lastChild]);
      })

      it("should select both rows", function() {
        assert.equal(2, Select.selected().length);
      });
    });

    describe("when selecting with removeSelected", function() {
      beforeEach(function() {
        Select.select([filesContainer.lastChild], true);
      })

      it("should deselect the previous selected row", function() {
        assert.equal(1, Select.selected().length);
      });
    });
  });

  describe('#selectAll()', function() {
    var files;
    beforeEach(function() {
      filesContainer.innerHTML = '<div class="row"></div><div class="row"></div>';
      Select.selectAll();
    });

    it("should select all rows", function() {
      assert.equal(2, Select.selected().length);
    });
  });

  describe('#toggleSelect()', function() {
    var files;
    beforeEach(function() {
      filesContainer.innerHTML = '<div class="row"></div><div class="row"></div>';
    });

    it("should toggle row selected/unselected", function() {
      Select.toggleSelect(filesContainer.firstChild);
      assert.equal(1, Select.selected().length);
      assert.equal(filesContainer.firstChild, Select.selected()[0]);
      Select.toggleSelect(filesContainer.firstChild);
      assert.equal(0, Select.selected().length);
    });
  });

  describe('#selectUntil()', function() {
    var files;
    beforeEach(function() {
      filesContainer.innerHTML = '<div class="row"></div><div class="row"></div><div class="row"></div><div class="row"></div><div class="row"></div>';
    });

    it("should select all rows in range in any direction", function() {
      Select.select([filesContainer.childNodes[2]]);

      // Moving up
      Select.selectUntil(filesContainer.childNodes[0]);
      assert.equal(3, Select.selected().length);
      assert.equal(filesContainer.firstChild, Select.selected()[0]);
      assert.equal(filesContainer.childNodes[1], Select.selected()[1]);

      // Moving down
      Select.selectUntil(filesContainer.childNodes[4]);
      assert.equal(5, Select.selected().length);
      assert.equal(filesContainer.childNodes[3], Select.selected()[3]);
      assert.equal(filesContainer.lastChild, Select.selected()[4]);
    });
  });

  describe('#moveDirection()', function() {
    var files;
    beforeEach(function() {
      filesContainer.innerHTML = '<div class="row"></div><div class="row"></div><div class="row"></div>';
    });

    describe("moving up", function() {
      it("should select next row in sequence", function() {
        Select.select([filesContainer.childNodes[1]]);
        Select.moveDirection("up", true);
        assert.equal(1, Select.selected().length);
        assert.equal(filesContainer.firstChild, Select.selected()[0]);
      });

      it("should not find anything before first", function() {
        Select.select([filesContainer.firstChild]);
        Select.moveDirection("up", true);
        assert.equal(1, Select.selected().length);
        assert.equal(filesContainer.firstChild, Select.selected()[0]);
      });
    });

    describe("moving down", function() {
      it("should select next row in sequence", function() {
        Select.select([filesContainer.childNodes[1]]);
        Select.moveDirection("down", true);
        assert.equal(1, Select.selected().length);
        assert.equal(filesContainer.lastChild, Select.selected()[0]);
      });

      it("should not find anything past last", function() {
        Select.select([filesContainer.lastChild]);
        Select.moveDirection("down", true);
        assert.equal(1, Select.selected().length);
        assert.equal(filesContainer.lastChild, Select.selected()[0]);
      });
    });
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

  describe('#scrollToSelection()', function() {
    var fileContainerRect,
      fileRow1Rect,
      fileRow2Rect,
      scrollTopSpy;

    beforeEach(function() {
      filesContainer.innerHTML = '<div class="row"></div><div class="row"></div>';
      sinon.stub(filesContainer, "getBoundingClientRect", function() { return fileContainerRect; });
      sinon.stub(filesContainer.childNodes[0], "getBoundingClientRect", function() { return fileRow1Rect; });
      sinon.stub(filesContainer.childNodes[1], "getBoundingClientRect", function() { return fileRow2Rect; });
      sinon.stub(Select, "scrollTop", function(el, position) {
        if (typeof position == "undefined") {
          return parseInt(el.getAttribute('scroll-top'));
        }
        return el.setAttribute("scroll-top", position);
      });
    });

    afterEach(function() {
      filesContainer.getBoundingClientRect.restore();
      filesContainer.childNodes[0].getBoundingClientRect.restore();
      filesContainer.childNodes[1].getBoundingClientRect.restore();
      Select.scrollTop.restore();
    });

    describe("already in view", function() {
      it("should not scroll", function() {
        Select.select([filesContainer.lastChild]);
        fileContainerRect = {
          top: 0,
          height: 100
        };
        fileRow2Rect = {
          top: 30,
          bottom: 50,
          height: 20
        };

        Select.scrollToSelection();
        assert.equal(null, filesContainer.getAttribute("scroll-top"));
        Select.scrollToSelection("up");
        assert.equal(null, filesContainer.getAttribute("scroll-top"));
      });
    });

    describe("moving up", function() {
      it("should scroll so top row is shown first", function() {
        Select.select([filesContainer.firstChild]);
        Select.scrollTop(filesContainer, 20);
        fileContainerRect = {
          top: 20,
          height: 100
        };
        fileRow1Rect = {
          top: 0,
          height: 20
        };

        assert.equal(20, Select.scrollTop(filesContainer));
        Select.scrollToSelection("up");
        assert.equal(0, Select.scrollTop(filesContainer));
      });
    });

    describe("moving down", function() {
      it("should scroll so bottom row is shown last", function() {
        Select.select([filesContainer.lastChild]);
        Select.scrollTop(filesContainer, 0);
        fileContainerRect = {
          top: 0,
          height: 100
        };
        fileRow2Rect = {
          bottom: 120,
          height: 20
        };

        assert.equal(0, Select.scrollTop(filesContainer));
        Select.scrollToSelection("down");
        assert.equal(20, Select.scrollTop(filesContainer));
      });
    });
  });
});