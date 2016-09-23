export default class Select {
  constructor(fileList) {
    this.fileList = fileList;
  }

  el() {
    return this.fileList.el();
  }

  items() {
    return this.el().querySelectorAll(".row");
  }

  indexOf(item) {
      var children = this.items(),
          i = 0;
      for (; i < children.length; i++) {
          if (children[i] == item) {
              return i;
          }
      }
      return -1;
  }

  selected() {
    return this.el().querySelectorAll('.selected');
  }

  deselect(items) {
    for(var i = 0, length = items.length; i < length; ++i) {
      if (items[i].classList.contains('selected'))
        items[i].classList.remove('selected');
    }
    this.updateFileListSelect();
  }

  deselectAll() {
    this.deselect(this.selected());
  }

  select(items, removeSelected) {
    if (removeSelected) this.deselectAll();
    for(var i = 0, length = items.length; i < length; ++i) {
      if (!items[i].classList.contains('selected'))
        items[i].classList.add('selected');
    }
    this.updateFileListSelect();
  }

  selectAll() {
    this.select(this.items());
  }

  toggleSelect(item) {
    if (this.el().contains(item)) {
      if (item.classList.contains('selected')) {
        this.deselect([item]);
      } else {
        this.select([item]);
      }
    }
  }

  selectUntil(item) {
    var selected = this.selected(),
      items = this.items(),
      itemPos = this.indexOf(item),
      itemsToSelect = [],
      firstSelectedItem = selected[0],
      lastSelectedItem = selected[selected.length - 1];

    if (!selected.length) {
      return false;
    }

    if (itemPos < this.indexOf(lastSelectedItem)) {
      itemsToSelect = [].slice.call(items).filter((element, index, array) => {
        return index >= this.indexOf(item) && index < this.indexOf(lastSelectedItem);
      });
    } else {
      itemsToSelect = [].slice.call(items).filter((element, index, array) => {
        return index <= this.indexOf(item) && index > this.indexOf(firstSelectedItem);
      });
    }
    this.select(itemsToSelect);
  }

  updateFileListSelect() {
    this.fileList.selectedFiles.splice(0, this.fileList.selectedFiles.length);
    var selected = this.selected();
    for(var i = 0, length = selected.length; i < length; ++i) {
      this.fileList.selectedFiles.push(this.fileList.getFileForElement(selected[i]));
    }
  }

  moveDirection(direction, removeSelected) {
    var selected = this.selected(),
      nextFile,
      currentIndex;
    if (direction == 'up') {
      currentIndex = this.indexOf(selected[0]);

      // In case everything is selected, revert to the first item
      if (removeSelected && selected.length == this.items().length) currentIndex++;

      nextFile = this.items()[currentIndex - 1];
    } else {
      currentIndex = this.indexOf(selected[selected.length - 1]);

      // In case everything is selected, revert to the last item
      if (removeSelected && selected.length == this.items().length) currentIndex--;

      nextFile = this.items()[currentIndex + 1];
    }

    if (nextFile) {
      this.select([nextFile], removeSelected);
      this.scrollToSelection(direction);
    }
  }

  selectedToCSV() {
    var files = [].slice.call(this.selected()).map((el) => {
      return this.fileList.getFileForElement(el);
    });
    if (files.length < 1) files = this.fileList.files;
    return this.fileList.toCSV(files);
  }

  removeSelected() {
    var files = [].slice.call(this.selected()).map((el) => {
      return this.fileList.getFileForElement(el);
    });
    this.fileList.removeFiles(files);
    this.deselectAll();
  }

  scrollTop(el, position) {
    if (typeof position == "undefined") {
      return el.scrollTop;
    }
    return el.scrollTop = position;
  }

  scrollToSelection(direction) {
    var items = this.selected(),
      curScrollTop = this.scrollTop(this.el()),
      scrollTop,
      elHeight = this.el().getBoundingClientRect().height;

    if (direction == 'up') {
      scrollTop = items[0].getBoundingClientRect().top;
    } else {
      scrollTop = items[items.length - 1].getBoundingClientRect().bottom - elHeight;
    }

    scrollTop = scrollTop - this.el().getBoundingClientRect().top + curScrollTop;
    if (
      (direction == "up" && scrollTop < curScrollTop) ||
      (direction !== "up" && scrollTop > (curScrollTop - elHeight)))
      this.scrollTop(this.el(), scrollTop);
  }
}
