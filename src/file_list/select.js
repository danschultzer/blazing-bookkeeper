class Select {
  constructor (fileList) {
    this.fileList = fileList
    this.el = () => this.fileList.el()
    this.items = () => this.el().querySelectorAll('.row')
    this.indexOf = item => {
      var children = this.items()
      for (let i = 0; i < children.length; i++) {
        if (children[i] === item) {
          return i
        }
      }
      return -1
    }
    this.selected = () => this.el().querySelectorAll('.selected')
    this.deselect = items => {
      for (let i = 0, length = items.length; i < length; ++i) {
        if (items[i].classList.contains('selected')) {
          items[i].classList.remove('selected')
        }
      }
      this.updateFileListSelect()
    }
    this.deselectAll = () => this.deselect(this.selected())
    this.select = (items, removeSelected) => {
      if (removeSelected) this.deselectAll()
      for (let i = 0, length = items.length; i < length; ++i) {
        if (!items[i].classList.contains('selected')) {
          items[i].classList.add('selected')
        }
      }
      this.updateFileListSelect()
    }
    this.selectAll = () => this.select(this.items())
    this.toggleSelect = item => {
      if (this.el().contains(item)) {
        if (item.classList.contains('selected')) {
          this.deselect([item])
        } else {
          this.select([item])
        }
      }
    }
    this.selectUntil = item => {
      var selected = this.selected()
      var items = this.items()
      var itemPos = this.indexOf(item)
      var itemsToSelect = []
      var firstSelectedItem = selected[0]
      var lastSelectedItem = selected[selected.length - 1]

      if (!selected.length) return false

      if (itemPos < this.indexOf(lastSelectedItem)) {
        itemsToSelect = [].slice.call(items).filter((element, index, array) =>
          index >= this.indexOf(item) && index < this.indexOf(lastSelectedItem)
        )
      } else {
        itemsToSelect = [].slice.call(items).filter((element, index, array) =>
          index <= this.indexOf(item) && index > this.indexOf(firstSelectedItem)
        )
      }
      this.select(itemsToSelect)
    }
    this.updateFileListSelect = () => {
      this.fileList.selectedFiles.splice(0, this.fileList.selectedFiles.length)
      var selected = this.selected()
      for (let i = 0, length = selected.length; i < length; ++i) {
        this.fileList.selectedFiles.push(this.fileList.getFileForElement(selected[i]))
      }
    }
    this.moveDirection = (direction, removeSelected) => {
      var selected = this.selected()
      var nextFile
      var currentIndex
      if (direction === 'up') {
        currentIndex = this.indexOf(selected[0])

        // In case everything is selected, revert to the first item
        if (removeSelected && selected.length === this.items().length) currentIndex++

        nextFile = this.items()[currentIndex - 1]
      } else {
        currentIndex = this.indexOf(selected[selected.length - 1])

        // In case everything is selected, revert to the last item
        if (removeSelected && selected.length === this.items().length) currentIndex--

        nextFile = this.items()[currentIndex + 1]
      }

      if (nextFile) {
        this.select([nextFile], removeSelected)
        this.scrollToSelection(direction)
      }
    }
    this.selectedToCSV = () => {
      var files = [].slice.call(this.selected()).map(el => this.fileList.getFileForElement(el))
      if (files.length < 1) files = this.fileList.files
      return this.fileList.toCSV(files)
    }
    this.removeSelected = () => {
      var files = [].slice.call(this.selected()).map(el => this.fileList.getFileForElement(el))
      this.fileList.removeFiles(files)
      this.deselectAll()
    }
    this.scrollTop = (el, position) => {
      if (typeof position === 'undefined') {
        return el.scrollTop
      }
      el.scrollTop = position
      return el.scrollTop
    }
    this.scrollToSelection = direction => {
      var items = this.selected()
      var curScrollTop = this.scrollTop(this.el())
      var scrollTop
      var elHeight = this.el().getBoundingClientRect().height

      if (direction === 'up') {
        scrollTop = items[0].getBoundingClientRect().top
      } else {
        scrollTop = items[items.length - 1].getBoundingClientRect().bottom - elHeight
      }

      scrollTop = scrollTop - this.el().getBoundingClientRect().top + curScrollTop
      if (
        (direction === 'up' && scrollTop < curScrollTop) ||
        (direction !== 'up' && scrollTop > (curScrollTop - elHeight))) {
        this.scrollTop(this.el(), scrollTop)
      }
    }
  }
}

export default Select
