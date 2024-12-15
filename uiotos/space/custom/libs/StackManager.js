function StackManager() {}
ht.Default.def(StackManager, Object, {
    _zIndex: 1,
    _length: 0,
    addDialog: function (dialog) {
        var self = this;
        self.removeDialog(dialog);
        self._length += 2; //因为上面一句会先移出去一下，减去1了
        dialog._clickHandler = function () {
            dialog.setZIndex(self._zIndex++);
        };
        dialog.getView().addEventListener('mousedown', dialog._clickHandler);
    },
    removeDialog: function (dialog) {
        this._length -= 1;
        dialog.getView().removeEventListener('mousedown', dialog._clickHandler);
    },
    count: function () {
        return this._length;
    }
});