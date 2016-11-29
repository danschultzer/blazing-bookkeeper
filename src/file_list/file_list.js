import tmp from 'tmp';
import jetpack from 'fs-jetpack';
import scanner from 'receipt-scanner';
import Select from './select';
import Util from './util';

export class FileList {
  constructor(elId) {
    this.elId = elId,
    this.files = [],
    this.fileIndex = -1,
    this.selectedFiles = [],
    this.Select = new Select(this),
    this.Util = new Util(this),
    this.maxConcurrent = 2;
  }

  el() {
    return document.getElementById(this.elId);
  }

  addFiles(files) {
    for(var i = 0; i < files.length; ++i) {
      var extractedFiles = this.Util.extractFiles(files[i]);
      for(var j = 0; j < extractedFiles.length; ++j) {
        this.addFile(extractedFiles[j].name, extractedFiles[j].path, extractedFiles[j].size, extractedFiles[j].type);
      }
    }
  }

  getFileIndexForIndex(index) {
    return this.files.findIndex(function(f) { return f.index === index; });
  }

  createSmoothPercentProgressionInterval(index) {
    var interval = new Util.Interval(() => {
      var file = this.getFileForIndex(index);
      if (!file || file.done) return interval.clear();
      var maxAmount = parseInt(file.percentDone * 100),
        amount = file.progressBar;
      if (amount < maxAmount) {
        ++amount;
        this.updateFile(index, { progressBar: amount });
      }
    }, 15);

    return interval;
  }

  addFile(name, path, filesize) {
    this.files.push({
      index: this.fileIndex++,
      file: {
        name: name,
        path: path,
        filesize: filesize,
        humanFileSize: this.Util.humanFileSize(filesize)
      },
      percentDone: 0,
      progressBar: 0,
      timeStarted: new Date(),
      timeEnded: null,
      timeElapsed: 0,
      processing: false,
      done: false
    });

    this.processQueue();
  }

  queued() {
    return this.files.filter(function(f) {
      return f.done === false && f.processing === false;
    });
  }

  queuedCount() {
    return this.queued().length;
  }

  processingCount() {
    return this.files.filter(function(f) {
      return f.done === false && f.processing === true;
    }).length;
  }

  processQueue() {
    if (this.processingCount() < this.maxConcurrent && this.queuedCount() > 0) {
      var file = this.queued()[0],
        index = file.index,
        name = file.file.name,
        path = file.file.path;

        this.updateFile(index, {
          processing: true
        });

        var tmpFile = tmp.tmpNameSync({ postfix: name.substr(name.lastIndexOf('.')) }),
          stream = jetpack.createReadStream(path),
          finishedCallback = (error, result) => {
            this.updateFile(index, {
              processing: false,
              done: true,
              timeEnded: new Date(),
              result: {
                error: error,
                parsed: result
              }
            });
            this.processQueue();
          },
          tickerCallback = (percent, time) => {
            this.updateFile(index, {
              percentDone: percent
            });
          };

        // Async call
        setTimeout(() => {
          scanner(stream)
            .ticker(tickerCallback)
            .parse(finishedCallback);
        }, 0);

        this.createSmoothPercentProgressionInterval(index);
        this.processQueue();
    }
  }

  updateFile(index, object) {
    index = this.getFileIndexForIndex(index);
    var updatedFileObj = this.files[index];

    if (updatedFileObj) {
      this.files[index] = Object.assign({}, this.files[index], object);

      // For ticker
      this.files[index] = Object.assign({}, this.files[index], { timeElapsed: (((updatedFileObj.timeEnded || new Date()) - updatedFileObj.timeStarted) / 1000).toFixed(1) });

      this.files.$set(index, this.files[index]);
    }
  }

  results() {
    return {
      done: {
        total: this.files.filter(function(element) { return element.done; }).length,
        successful: this.files.filter(function(element) { return element.done && element.result.parsed && element.result.parsed.amount && element.result.parsed.date; }).length,
        failures: this.files.filter(function(element) { return element.done && element.result.error; }).length
      },
      processing: {
        total: this.files.filter(function(element) { return !element.done; }).length
      }
    };
  }

  toCSV(files) {
    var text = 'Name\tAmount\tDate\tPath\n';
    for (var i = 0, length = files.length; i < length; ++i) {
      var values = [
        files[i].file.name,
        files[i].result && files[i].result.parsed ? (files[i].result.updated || {}).amount || files[i].result.parsed.amount : '',
        files[i].result && files[i].result.parsed ? (files[i].result.updated || {}).date || files[i].result.parsed.date : '',
        files[i].file.path
      ];
      values = values.map(function(value) {
        if (value && value.length && (value.indexOf('"') > -1 || value.indexOf('\t') > -1))
          return '"' + value.replace('"', '\\"') + '"';

        return value;
      });

      text += values.join('\t') + '\n';
    }
    return text;
  }

  getIndexForElement(el) {
    return parseInt(el.getAttribute('data-index'));
  }

  getFileForElement(el) {
    return this.getFileForIndex(this.getIndexForElement(el));
  }

  getFileForIndex(index) {
    return this.files[this.getFileIndexForIndex(index)];
  }

  removeFiles(files) {
    for(var i = 0, length = files.length;i < length;++i) {
      this.files.splice(this.files.indexOf(files[i]), 1);
    }
  }
}
