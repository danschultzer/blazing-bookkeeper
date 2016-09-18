import { assert } from 'chai';
import testUtils from './utils';
import sinon from 'sinon';

describe('application launch', function() {

  beforeEach(testUtils.beforeEach);
  beforeEach(function() {
    return this.app.client.windowByIndex(0);
  });
  afterEach(testUtils.afterEach);

  it('shows one window', function() {
    return this.app.browserWindow.isVisible().then(function(visible) {
      assert.equal(visible, true);
    }).getWindowCount().then(function(count) {
      assert.equal(count, 1);
    });
  });

  it('shows welcome screen', function() {
    return this.app.client.element('.welcome').isVisible().then(function(visible) {
      assert.equal(visible, true);
    });
  });

  describe("when clicking to add file", function() {
    beforeEach(function() {
      return this.app.client.click('#plus-button-open').waitForVisible(".table .body .row", 500);
    });

    it('should show file', function() {
      var app = this.app;

      return this.app.client.element(".table .body .row")
        .isVisible().then(function(visible) {
          assert.equal(visible, true);
        })
        .getText(".table .body .row").then(function(text) {
          assert.include(text, "readable.pdf");
          assert.include(text, "2016-06-13");
          assert.include(text, "6000.00");
        });
    });

    describe('when double clicking on file row', function() {
      beforeEach(function() {
        return this.app.client.doubleClick(".table .body .row")
          .waitUntilWindowLoaded();
      });

      it("shows new browser window", function() {
        return this.app.client.getWindowCount().then(function(count) {
          assert.equal(count, 2);
        });
      });

      describe("when entering information, and clicking save", function() {
        beforeEach(function() {
          return this.app.client.windowByIndex(1).setValue('#date', '2016-01-01')
            .setValue('#amount', '125.00')
            .click("button=Update");
        });

        it("closes window", function() {
          var app = this.app;

          return app.client.waitUntil(function() {
            return app.client.getWindowCount().then(function(count) {
              return count == 1;
            });
          }, 1000, 'expected window to close after 1s');
        });

        it("updates values", function() {
          return this.app.client.windowByIndex(0)
            .getText(".table .body .row").then(function(text) {
              assert.include(text, "readable.pdf");
              assert.include(text, "2016-01-01");
              assert.include(text, "125.00");
            });
        });
      });
    });
  });
});
