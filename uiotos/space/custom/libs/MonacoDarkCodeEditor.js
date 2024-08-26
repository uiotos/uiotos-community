// 创建命名空间示例
var cs = window.cs = {};

var MonacoDarkEditor = cs.MonacoDarkCodeEditor = function(config) {
    var div = this._view = document.createElement('div'),
        editableLayer = this._editableLayer = document.createElement('div'),
        style = editableLayer.style;

    this.config = config;
    this._editable = true;
    style.backgroundColor = 'rgba( 255, 255, 255, 0.3)';
    style.position = 'absolute';
    style.top = 0;
    style.right = 0;
    style.bottom = 0;
    style.left = 0;
    style.zIndex = 1000;

    div.style.position = 'absolute';
}
 /**
 * 获取根层 dom
 */
MonacoDarkEditor.prototype.getView = function() {
    return this._view;
}

/**
 * 设置值
 * @param {String} v 
 */
MonacoDarkEditor.prototype.setValue = function(v) {
    if (v === undefined || v === null) {
        v = '';
    }
    if (this.getEditor()) this.getEditor().setValue(v);
}
/**
 * 获取值
 */
MonacoDarkEditor.prototype.getValue = function() {
    return this.getEditor() && this.getEditor().getValue();
}
/**
 * 重新刷新|布局组件
 */
MonacoDarkEditor.prototype.layout = function() {
    this.getEditor() && this.getEditor().layout();
}

MonacoDarkEditor.prototype.getEditor = function() {
    if (!this._monacoEditor && window.monaco) {
        this._monacoEditor = monaco.editor.create(this._view, this.config || {
            value: '',
            language: 'javascript',
            theme: 'vs-dark',
            minimap: {
                enabled: false
            }
        });
    }
    return this._monacoEditor;
}
MonacoDarkEditor.prototype.invalidate = function() {
    this.layoutLater();
}
MonacoDarkEditor.prototype.iv = function () {
    this.invalidate();
}
MonacoDarkEditor.prototype.layoutLater = function(after) {
    var self = this;
    setTimeout(function() {
        self.layout();
    }, after || 300);
}
MonacoDarkEditor.prototype.setEditable = function(editable) {
    if (this._monacoEditor instanceof ht.widget.TextArea) {
        this._monacoEditor.setEditable(editable);
        return;
    }
    if (this._editable === editable) return; 
    var editableLayer = this._editableLayer;
    if (editable) {
        if (editableLayer.parentNode) {
            editableLayer.parentNode.removeChild(editableLayer);
        }
    }
    else {
        this.getView().appendChild(editableLayer);
    }
    this._editable = editable;
}
MonacoDarkEditor.prototype.isEditable = function() {
    return this._editable;
}