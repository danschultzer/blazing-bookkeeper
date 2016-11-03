import electron from 'electron';
import { Application } from 'spectron';

var beforeEach = function() {
    this.timeout(10000);
    this.app = new Application({
        path: electron,
        startTimeout: 10000,
        waitTimeout: 10000,
        args: ['-r', './e2e/mocks.js', './app'],
    });
    return this.app.start();
};

var afterEach = function() {
    this.timeout(10000);
    if (this.app && this.app.isRunning()) {
        return this.app.stop();
    }
};

export default {
    beforeEach: beforeEach,
    afterEach: afterEach,
};
