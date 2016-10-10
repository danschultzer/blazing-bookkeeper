import { assert } from 'chai';
import testUtils from './utils';
import sinon from 'sinon';

describe('application launch', function() {
  beforeEach(testUtils.beforeEach);
  beforeEach(function() {
    return this.app.client.windowByIndex(0);
  });
  afterEach(testUtils.afterEach);

  it("shows one window", function() {
    return this.app.browserWindow.isVisible().then(function(visible) {
      assert.equal(visible, true);
    }).getWindowCount().then(function(count) {
      assert.equal(count, 1);
    });
  });

  it("shows welcome screen", function() {
    return this.app.client.element('.welcome').isVisible().then(function(visible) {
      assert.equal(visible, true);
    });
  });

  describe('when clicking to add file', function() {
    beforeEach(function() {
      return this.app.client.click('#plus-button-open').waitForVisible(".table .body .row", 1000);
    });

    it("should show file", function() {
      var app = this.app;

      return this.app.client.element(".table .body .row:nth-child(1)")
        .isVisible().then(function(visible) {
          assert.equal(visible, true);
        })
        .waitUntilTextExists(".table .body .row .cell:nth-child(2)", "2016-06-13")
        .getText(".table .body .row").then(function(text) {
          assert.include(text, "readable.pdf");
          assert.include(text, "2016-06-13");
          assert.include(text, "6000.00");
        });
    });

    describe('when copying', function() {
      it("should copy CSV to clipboard", function() {
        return this.app.client.click(".table .body .row")
          .execute(function() {
            document.dispatchEvent(new Event('copy'));
          })
          .electron.clipboard.readText().then(function(text) {
            assert.include(text, "Name\tAmount\tDate\tPath\n");
            assert.include(text, "readable.pdf\t");
          });
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

      describe('when entering information, and clicking save', function() {
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
          }, 1000, 'expected window to close');
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

      describe('when reporting an error', function() {
        beforeEach(function() {
          return this.app.client.windowByIndex(1).click("=Wrong results? Report it so Blazing Bookkeeper can be improved!")
            .waitUntilWindowLoaded();
        });

        it("shows new browser window", function() {
          return this.app.client.getWindowCount().then(function(count) {
            assert.equal(count, 3);
          });
        });

        describe('when entering information, and sending it', function() {
          beforeEach(function() {
            return this.app.client.windowByIndex(2)
              .setValue("#email", "error@report.com")
              .setValue("#comments", "There was an error");
          });

          it("should have an email", function() {
            this.app.client.timeouts('script', 60000);
            this.app.client.executeAsync(function (done) {
              return this.app.client.windowByIndex(2)
                .getText("#email").then(function(text) {
                  assert.include(text, "error@report.com");
                });
                done();
            });
          });

          it("should have a comment", function() {
            this.app.client.timeouts('script', 60000);
            this.app.client.executeAsync(function (done) {
              return this.app.client.windowByIndex(2)
                .getText("#comments").then(function(text) {
                  assert.include(text, "There was an error");
                });
                done();
            });
          });
        });

        describe('when entering information, and sending it anonymized', function() {
          beforeEach(function() {
            return this.app.client.windowByIndex(2)
              .click("#anonymized")
              .setValue("#comments", "There was an error");
          });

          it("should have a comment", function() {
            this.app.client.timeouts('script', 60000);
            this.app.client.executeAsync(function (done) {
              return this.app.client.windowByIndex(2)
                .getText("#comments").then(function(text) {
                  assert.include(text, "There was an error");
                });
            });
          });
        });
      });
    });
  });
});
