import jetpack from 'fs-jetpack'; // module loaded from npm
import mime from 'mime';

export default class Util {
  constructor(fileList) {
    this.fileList = fileList;
  }

  // https://gist.github.com/kethinov/6658166
  walkSync(dir, filelist) {
    var files = jetpack.list(dir);
    filelist = filelist || [];
    files.forEach((file) => {
        if (this.isDir(dir + '/' + file)) {
            filelist = this.walkSync(dir + '/' + file, filelist);
        } else {
            filelist.push(dir + '/' + file);
        }
    });
    return filelist;
  }

  isDir(path) {
    return jetpack.exists(path) && jetpack.inspect(path).type == 'dir';
  }

  filterFiles(filelist) {
    return filelist.filter(function(element, index, array) {
      return (['pdf', 'jpeg', 'jpg', 'gif', 'png', 'bmp'].indexOf((element.path || element).split('.').pop().toLowerCase()) !== -1);
    });
  }

  extractFiles(file) {
    var files = [file];

    // Filter non existing files
    files = files.filter(function(element, index, array) {
      return jetpack.exists(element.path || element);
    });

    // Expand directories
    for (var i = 0; i < files.length; i++) {
      if (this.isDir(files[i].path || files[i])) {
          var expanded_files = this.walkSync(files[i].path || files[i]);
          files.splice(i, 1);
          files.push.apply(files, expanded_files);
      }
    }

    // Filter invalid files
    files = this.filterFiles(files);

    return files.map(function(file){
      if (!file.path) {
        var object = jetpack.inspect(file);

        object.path = file;
        object.type = mime.lookup(file);

        return object;
      } else {
        return file;
      }
    });
  }

  humanFileSize(bytes, si) {
      var thresh = si ? 1000 : 1024;
      if(Math.abs(bytes) < thresh) {
          return bytes + ' B';
      }
      var units = si ?
        ['kB','MB','GB','TB','PB','EB','ZB','YB'] :
        ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
      var u = -1;
      do {
          bytes /= thresh;
          ++u;
      } while(Math.abs(bytes) >= thresh && u < units.length - 1);
      return bytes.toFixed(1)+' '+units[u];
  }
}


Util.Interval = function(fn, interval) {
  var id = setInterval(fn, interval);
  this.cleared = false;
  this.clear = function () {
    this.cleared = true;
    clearInterval(id);
  };
};
