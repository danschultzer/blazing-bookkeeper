/* eslint-env mocha */
import { assert } from 'chai'
import testUtils from './utils'

describe('application launch', function () {
  beforeEach(testUtils.beforeEach)
  beforeEach(function () {
    return this.app.client.windowByIndex(0)
  })
  afterEach(testUtils.afterEach)

  it('shows one window', function () {
    return this.app.browserWindow.isVisible().then(function (visible) {
      assert.equal(visible, true)
    }).getWindowCount().then(function (count) {
      assert.equal(count, 1)
    })
  })

  it('shows welcome screen', function () {
    return this.app.client.element('.welcome').isVisible().then(function (visible) {
      assert.equal(visible, true)
    })
  })

  describe('when clicking to add file', function () {
    beforeEach(function () {
      return this.app.client.click('#plus-button-open').waitForVisible('.table .body .row', 1000)
    })

    it('should show file', function () {
      return this.app.client.element('.table .body .row:nth-child(1)')
        .isVisible().then(function (visible) {
          assert.equal(visible, true)
        })
        .waitUntilTextExists('.table .body .row .cell:nth-child(2)', '2016-06-13')
        .getText('.table .body .row').then(function (text) {
          assert.include(text, 'readable.pdf')
          assert.include(text, '2016-06-13')
          assert.include(text, '6000.00')
        })
    })

    describe('when removing', function () {
      it('remove file from list', function () {
        return this.app.client.element('.table .body .row:nth-child(1)')
          .isVisible().then(function (visible) {
            assert.equal(visible, true)
          })
          .waitUntilTextExists('.table .body .row .cell:nth-child(2)', '2016-06-13')
          .click('.table .body .row:nth-child(1)').execute(function () {
            document.dispatchEvent(new window.Event('remove'))
          })
          .isExisting('.table .body .row:nth-child(1)').then(function (existing) {
            assert.equal(existing, false)
          })
      })
    })

    describe('when copying', function () {
      it('should copy CSV to clipboard', function () {
        return this.app.client.click('.table .body .row')
          .execute(function () {
            document.dispatchEvent(new window.Event('copy'))
          })
          .electron.clipboard.readText().then(function (text) {
            assert.include(text, 'Name\tAmount\tDate\tPath\n')
            assert.include(text, 'readable.pdf\t')
          })
      })
    })

    describe('when double clicking on file row', function () {
      beforeEach(function () {
        return this.app.client.doubleClick('.table .body .row')
          .waitUntilWindowLoaded()
      })

      it('shows new browser window', function () {
        return this.app.client.getWindowCount().then(function (count) {
          assert.equal(count, 2)
        })
      })

      describe('when entering information, and clicking save', function () {
        beforeEach(function () {
          return this.app.client.windowByIndex(1).setValue('#date', '2016-01-01')
            .setValue('#amount', '125.00')
            .click('button=Update')
        })

        it('closes window', function () {
          var app = this.app

          return app.client.waitUntil(function () {
            return app.client.getWindowCount().then(function (count) {
              return count === 1
            })
          }, 1000, 'expected window to close')
        })

        it('updates values', function () {
          return this.app.client.windowByIndex(0)
            .getText('.table .body .row').then(function (text) {
              assert.include(text, 'readable.pdf')
              assert.include(text, '2016-01-01')
              assert.include(text, '125.00')
            })
        })
      })

      describe('when reporting an error', function () {
        beforeEach(function () {
          return this.app.client.windowByIndex(1).click('=Wrong results? Report it so Blazing Bookkeeper can be improved!')
            .waitUntilWindowLoaded().windowByIndex(2)
        })

        it('shows new browser window with attached file, email and comments', function () {
          return this.app.client.getWindowCount().then(function (count) {
            assert.equal(count, 3)
          }).isExisting('input[name="email"]').then(function (exists) {
            assert.equal(exists, true)
          }).isExisting('textarea[name="comments"]').then(function (exists) {
            assert.equal(exists, true)
          }).getText('html').then(function (text) {
            assert.include(text, __dirname.replace('/app', '/e2e') + '/support/readable.pdf')
          })
        })

        describe('when clicking to anonymize data', function () {
          beforeEach(function () {
            return this.app.client.click('[name="anonymized"]')
          })

          it('hides email, attached file and paths', function () {
            return this.app.client.getWindowCount().then(function (count) {
              assert.equal(count, 3)
            }).isExisting('input[name="email"]').then(function (exists) {
              assert.equal(exists, false)
            }).isExisting('textarea[name="comments"]').then(function (exists) {
              assert.equal(exists, true)
            }).getText('html').then(function (text) {
              assert.notInclude(text, __dirname.replace('/app', '/e2e') + '/support/readable.pdf')
            })
          })
        })
      })
    })
  })
})
